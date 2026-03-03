/**
 * =========================================================================================
 * 🏫 ORGANIZATION (O'QUV MARKAZ) API
 * =========================================================================================
 * 
 * O'quv markazlar uchun barcha API funksiyalari:
 * - CRUD operatsiyalari (create, read, update, delete)
 * - A'zolarni boshqarish (qo'shilish, chiqarish, rol o'zgartirish)
 * - Sinflar boshqaruvi
 * - O'quvchi analitikasi
 * =========================================================================================
 */

import { supabase } from '../supabaseClient';
import { Organization, OrganizationMember, OrgClass, OrgRole, StudentAnalytics, TeacherTask, ParentStudentLink } from '../../types';
import { getCurrentUserId } from './session';
import { logger } from '../../utils/logger';

// =========================================================================================
// DB → Frontend Mappers
// =========================================================================================
const mapOrgFromDb = (row: any): Organization => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    logoUrl: row.logo_url || '',
    inviteCode: row.invite_code,
    ownerId: row.owner_id,
    subscriptionPlan: row.subscription_plan || 'free',
    maxStudents: row.max_students || 30,
    memberCount: row.member_count,
    createdAt: row.created_at,
});

const mapMemberFromDb = (row: any): OrganizationMember => ({
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    role: row.role as OrgRole,
    classId: row.class_id,
    joinedAt: row.joined_at,
    // Joined user data (from join query)
    userName: row.users?.name || row.user_name,
    userAvatar: row.users?.avatar || row.user_avatar,
    userXp: row.users?.xp ?? row.user_xp,
    userLevel: row.users?.level ?? row.user_level,
    userStreak: row.users?.streak ?? row.user_streak,
    userFocusMinutes: row.users?.focus_minutes ?? row.user_focus_minutes,
    userLastActive: row.users?.last_active ? new Date(row.users.last_active).getTime() : undefined,
});

const mapClassFromDb = (row: any): OrgClass => ({
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    teacherId: row.teacher_id,
    teacherName: row.teacher?.name,
    createdAt: row.created_at,
});

// =========================================================================================
// API Functions
// =========================================================================================
export const organizationsApi = {
    /**
     * Yangi o'quv markaz yaratish
     * Owner avtomatik teacher bo'ladi
     */
    async createOrganization(name: string, description?: string): Promise<Organization> {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Unauthorized');

        // Generate invite code
        const { data: codeData, error: codeError } = await supabase
            .rpc('generate_invite_code');

        if (codeError) {
            logger.error('Error generating invite code', codeError);
            throw new Error('Invite kod yaratishda xatolik');
        }

        const inviteCode = codeData || `ORG-${Date.now().toString(36).toUpperCase()}`;

        // Create organization
        const { data, error } = await supabase
            .from('organizations')
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                invite_code: inviteCode,
                owner_id: userId,
                subscription_plan: 'free',
                max_students: 30,
            })
            .select()
            .single();

        if (error) {
            logger.error('Error creating organization', error);
            throw new Error('Tashkilot yaratishda xatolik: ' + error.message);
        }

        // Add owner as teacher member
        await supabase
            .from('organization_members')
            .insert({
                org_id: data.id,
                user_id: userId,
                role: 'teacher',
            });

        return mapOrgFromDb(data);
    },

    /**
     * Foydalanuvchining tashkilotini olish (teacher yoki student sifatida)
     * Birinchi topilgan tashkilot qaytariladi
     */
    async getMyOrganization(): Promise<{ org: Organization; role: OrgRole } | null> {
        const orgs = await this.getMyOrganizations();
        return orgs.length > 0 ? orgs[0] : null;
    },

    /**
     * Foydalanuvchining BARCHA tashkilotlarini olish
     * Owner bo'lgan + a'zo bo'lganlari
     */
    async getMyOrganizations(): Promise<{ org: Organization; role: OrgRole }[]> {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        const results: { org: Organization; role: OrgRole }[] = [];

        // 1. Owner bo'lgan orglar
        const { data: ownedOrgs } = await supabase
            .from('organizations')
            .select('*')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });

        if (ownedOrgs) {
            for (const o of ownedOrgs) {
                results.push({ org: mapOrgFromDb(o), role: 'teacher' });
            }
        }

        // 2. A'zo bo'lgan orglar (owner emas)
        const { data: memberships } = await supabase
            .from('organization_members')
            .select('*, organizations(*)')
            .eq('user_id', userId)
            .order('joined_at', { ascending: false });

        if (memberships) {
            for (const m of memberships) {
                if (m.organizations) {
                    // Owner sifatida allaqachon qo'shilgan bo'lsa, skip
                    const alreadyAdded = results.some(r => r.org.id === (m.organizations as any).id);
                    if (!alreadyAdded) {
                        results.push({
                            org: mapOrgFromDb(m.organizations),
                            role: m.role as OrgRole,
                        });
                    }
                }
            }
        }

        return results;
    },

    /**
     * Invite kod orqali tashkilotga qo'shilish
     */
    async joinOrganization(inviteCode: string): Promise<Organization> {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Unauthorized');

        // Find org by invite code
        const { data: org, error: findError } = await supabase
            .from('organizations')
            .select('*')
            .eq('invite_code', inviteCode.trim().toUpperCase())
            .maybeSingle();

        if (findError || !org) {
            throw new Error('Invite kod noto\'g\'ri yoki tashkilot topilmadi');
        }

        // Try to join — let DB handle duplicate check via unique constraint
        const { error: joinError } = await supabase
            .from('organization_members')
            .insert({
                org_id: org.id,
                user_id: userId,
                role: 'student',
            });

        if (joinError) {
            // 23505 = unique_violation — already a member
            if (joinError.code === '23505') {
                // Allaqachon a'zo — bu xato emas, oddiy holat
                return mapOrgFromDb(org);
            }
            logger.error('Error joining organization', joinError);
            throw new Error('Tashkilotga qo\'shilishda xatolik');
        }

        return mapOrgFromDb(org);
    },

    /**
     * Tashkilot a'zolari ro'yxati (user ma'lumotlari bilan)
     */
    async getOrgMembers(orgId: string): Promise<OrganizationMember[]> {
        const { data, error } = await supabase
            .from('organization_members')
            .select('*, users(name, avatar, xp, level, streak, focus_minutes, last_active)')
            .eq('org_id', orgId)
            .order('joined_at', { ascending: true });

        if (error) {
            logger.error('Error fetching org members', error);
            return [];
        }

        return (data || []).map(mapMemberFromDb);
    },

    /**
     * O'quvchi analitikasi (RPC orqali — samarali)
     */
    async getStudentAnalytics(orgId: string): Promise<StudentAnalytics[]> {
        const { data, error } = await supabase
            .rpc('get_org_student_analytics', { p_org_id: orgId });

        if (error) {
            logger.error('Error fetching student analytics', error);
            return [];
        }

        return (data || []).map((row: any): StudentAnalytics => {
            const lastActiveMs = row.last_active ? new Date(row.last_active).getTime() : 0;
            const totalTasks = (Number(row.todos_total) || 0) + (Number(row.routines_total) || 0);
            const completedTasks = (Number(row.todos_completed) || 0) + (Number(row.routines_completed) || 0);
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;

            let riskLevel: 'safe' | 'warning' | 'danger' = 'safe';
            if (totalTasks > 0) {
                if (completionRate <= 30) riskLevel = 'danger';
                else if (completionRate <= 60) riskLevel = 'warning';
            }

            return {
                userId: row.user_id,
                name: row.name,
                avatar: row.avatar,
                xp: row.xp || 0,
                level: row.level || 1,
                streak: row.streak || 0,
                focusMinutes: row.focus_minutes || 0,
                todosCompleted: Number(row.todos_completed) || 0,
                todosTotal: Number(row.todos_total) || 0,
                routinesCompleted: Number(row.routines_completed) || 0,
                routinesTotal: Number(row.routines_total) || 0,
                lastActive: lastActiveMs,
                riskLevel,
            };
        });
    },

    /**
     * Sinf yaratish
     */
    async createClass(orgId: string, name: string, teacherId?: string): Promise<OrgClass> {
        const { data, error } = await supabase
            .from('classes')
            .insert({
                org_id: orgId,
                name: name.trim(),
                teacher_id: teacherId || null,
            })
            .select()
            .single();

        if (error) {
            logger.error('Error creating class', error);
            throw new Error('Sinf yaratishda xatolik');
        }

        return mapClassFromDb(data);
    },

    /**
     * Sinflar ro'yxati
     */
    async getClasses(orgId: string): Promise<OrgClass[]> {
        const { data, error } = await supabase
            .from('classes')
            .select('*, teacher:users!classes_teacher_id_fkey(name)')
            .eq('org_id', orgId)
            .order('created_at', { ascending: true });

        if (error) {
            logger.error('Error fetching classes', error);
            // Fallback without join
            const { data: fallbackData } = await supabase
                .from('classes')
                .select('*')
                .eq('org_id', orgId)
                .order('created_at', { ascending: true });
            return (fallbackData || []).map(mapClassFromDb);
        }

        // Count students per class
        const classes = (data || []).map(mapClassFromDb);
        for (const cls of classes) {
            const { count } = await supabase
                .from('organization_members')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', orgId)
                .eq('class_id', cls.id);
            cls.studentCount = count || 0;
        }

        return classes;
    },

    /**
     * A'zoni sinfga tayinlash
     */
    async assignMemberToClass(memberId: string, classId: string | null): Promise<void> {
        const { error } = await supabase
            .from('organization_members')
            .update({ class_id: classId })
            .eq('id', memberId);

        if (error) {
            logger.error('Error assigning member to class', error);
            throw new Error('Sinfga tayinlashda xatolik');
        }
    },

    /**
     * A'zo rolini o'zgartirish (teacher/member)
     */
    async updateMemberRole(memberId: string, role: OrgRole): Promise<void> {
        const { error } = await supabase
            .from('organization_members')
            .update({ role })
            .eq('id', memberId);

        if (error) {
            logger.error('Error updating member role', error);
            throw new Error('Rolni o\'zgartirishda xatolik');
        }
    },

    /**
     * A'zoni tashkilotdan chiqarish
     */
    async removeMember(orgId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('organization_members')
            .delete()
            .eq('org_id', orgId)
            .eq('user_id', userId);

        if (error) {
            logger.error('Error removing member', error);
            throw new Error('A\'zoni chiqarishda xatolik');
        }
    },

    /**
     * Tashkilot ma'lumotlarini yangilash
     */
    async updateOrganization(orgId: string, updates: Partial<Pick<Organization, 'name' | 'description' | 'logoUrl'>>): Promise<void> {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name.trim();
        if (updates.description !== undefined) dbUpdates.description = updates.description?.trim() || null;
        if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl || null;

        const { error } = await supabase
            .from('organizations')
            .update(dbUpdates)
            .eq('id', orgId);

        if (error) {
            logger.error('Error updating organization', error);
            throw new Error('Tashkilotni yangilashda xatolik');
        }
    },

    /**
     * Sinfni o'chirish
     */
    async deleteClass(classId: string): Promise<void> {
        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', classId);

        if (error) {
            logger.error('Error deleting class', error);
            throw new Error('Sinfni o\'chirishda xatolik');
        }
    },

    /**
     * Tashkilotdan chiqish (o'quvchi o'zi chiqadi)
     */
    async leaveOrganization(orgId: string): Promise<void> {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Unauthorized');

        const { error } = await supabase
            .from('organization_members')
            .delete()
            .eq('org_id', orgId)
            .eq('user_id', userId);

        if (error) {
            logger.error('Error leaving organization', error);
            throw new Error('Tashkilotdan chiqishda xatolik');
        }
    },

    /**
     * Barcha tashkilotlarni olish (admin uchun)
     */
    async getAllOrganizations(): Promise<Organization[]> {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Error fetching all organizations', error);
            throw new Error('Tashkilotlarni yuklashda xatolik');
        }

        return (data || []).map(mapOrgFromDb);
    },

    /**
     * Admin tomonidan foydalanuvchini tashkilotga qo'shish (teacher/member)
     */
    async addOrgMember(orgId: string, userId: string, role: OrgRole): Promise<void> {
        const { error } = await supabase
            .from('organization_members')
            .insert({
                org_id: orgId,
                user_id: userId,
                role,
            });

        if (error) {
            logger.error('Error adding org member', error);
            if (error.code === '23505') {
                throw new Error('Bu foydalanuvchi allaqachon tashkilotda');
            }
            throw new Error('A\'zoni qo\'shishda xatolik: ' + error.message);
        }
    },

    /**
     * Studentni guruhga (class) tayinlash
     */
    async assignStudentToClass(memberId: string, classId: string): Promise<void> {
        const { error } = await supabase
            .from('organization_members')
            .update({ class_id: classId })
            .eq('id', memberId);

        if (error) {
            logger.error('Error assigning student to class', error);
            throw new Error('Guruhga tayinlashda xatolik');
        }
    },

    /**
     * Studentni guruhdan chiqarish (class_id = null)
     */
    async removeStudentFromClass(memberId: string): Promise<void> {
        const { error } = await supabase
            .from('organization_members')
            .update({ class_id: null })
            .eq('id', memberId);

        if (error) {
            logger.error('Error removing student from class', error);
            throw new Error('Guruhdan chiqarishda xatolik');
        }
    },

    /**
     * Guruh a'zolarini olish
     */
    async getClassMembers(classId: string): Promise<OrganizationMember[]> {
        const { data, error } = await supabase
            .from('organization_members')
            .select(`
                id, org_id, user_id, role, class_id, joined_at,
                users:user_id (name, avatar, xp, level, streak, focus_minutes, last_active)
            `)
            .eq('class_id', classId)
            .order('joined_at', { ascending: true });

        if (error) {
            logger.error('Error fetching class members', error);
            throw new Error("Guruh a'zolarini yuklashda xatolik");
        }

        return (data || []).map(mapMemberFromDb);
    },

    // =====================================================================
    // TEACHER TASKS
    // =====================================================================

    async assignTask(orgId: string, task: { title: string; description?: string; assignedTo?: string; classId?: string; deadline?: string }): Promise<TeacherTask[]> {
        const userId = await getCurrentUserId();

        let inserts: any[] = [];
        if (task.assignedTo) {
            inserts = [{
                org_id: orgId, assigned_by: userId, assigned_to: task.assignedTo, class_id: task.classId || null,
                title: task.title, description: task.description || null, deadline: task.deadline || null
            }];
        } else if (task.classId) {
            // Assign to all students in the class
            const { data: members } = await supabase
                .from('organization_members')
                .select('user_id')
                .eq('org_id', orgId)
                .eq('class_id', task.classId)
                .eq('role', 'student');

            if (members && members.length > 0) {
                inserts = members.map(m => ({
                    org_id: orgId, assigned_by: userId, assigned_to: m.user_id, class_id: task.classId,
                    title: task.title, description: task.description || null, deadline: task.deadline || null
                }));
            } else {
                throw new Error("Guruhda o'quvchilar yo'q");
            }
        } else {
            throw new Error("O'quvchi yoki guruh tanlanishi shart");
        }

        const { data, error } = await supabase
            .from('teacher_assigned_tasks')
            .insert(inserts)
            .select(`*, student:assigned_to (name, avatar), teacher:assigned_by (name)`);

        if (error) {
            logger.error('Error assigning task', error);
            throw new Error('Vazifa berishda xatolik');
        }

        return (data || []).map((d: any) => ({
            id: d.id,
            orgId: d.org_id,
            assignedBy: d.assigned_by,
            assignedTo: d.assigned_to,
            assignedToName: d.student?.name,
            classId: d.class_id,
            title: d.title,
            description: d.description,
            deadline: d.deadline,
            completed: d.completed,
            completedAt: d.completed_at,
            createdAt: d.created_at,
        }));
    },

    async getTeacherTasks(orgId: string): Promise<TeacherTask[]> {
        const { data, error } = await supabase
            .from('teacher_assigned_tasks')
            .select(`
                *,
                student:assigned_to (name, avatar),
                teacher:assigned_by (name)
            `)
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Error fetching teacher tasks', error);
            throw new Error('Vazifalarni yuklashda xatolik');
        }

        return (data || []).map((d: any) => ({
            id: d.id,
            orgId: d.org_id,
            assignedBy: d.assigned_by,
            assignedTo: d.assigned_to,
            assignedToName: d.student?.name,
            assignedByName: d.teacher?.name,
            classId: d.class_id,
            title: d.title,
            description: d.description,
            deadline: d.deadline,
            completed: d.completed,
            completedAt: d.completed_at,
            createdAt: d.created_at,
        }));
    },

    async getMyAssignedTasks(): Promise<TeacherTask[]> {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('teacher_assigned_tasks')
            .select(`
                *,
                teacher:assigned_by (name)
            `)
            .eq('assigned_to', userId)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Error fetching assigned tasks', error);
            throw new Error('Berilgan vazifalarni yuklashda xatolik');
        }

        return (data || []).map((d: any) => ({
            id: d.id,
            orgId: d.org_id,
            assignedBy: d.assigned_by,
            assignedTo: d.assigned_to,
            assignedByName: d.teacher?.name,
            classId: d.class_id,
            title: d.title,
            description: d.description,
            deadline: d.deadline,
            completed: d.completed,
            completedAt: d.completed_at,
            createdAt: d.created_at,
        }));
    },

    async completeAssignedTask(taskId: string): Promise<void> {
        const { error } = await supabase
            .from('teacher_assigned_tasks')
            .update({ completed: true, completed_at: new Date().toISOString() })
            .eq('id', taskId);

        if (error) {
            logger.error('Error completing assigned task', error);
            throw new Error('Vazifani bajarishda xatolik');
        }
    },

    async deleteAssignedTask(taskId: string): Promise<void> {
        const { error } = await supabase
            .from('teacher_assigned_tasks')
            .delete()
            .eq('id', taskId);

        if (error) {
            logger.error('Error deleting assigned task', error);
            throw new Error("Vazifani o'chirishda xatolik");
        }
    },

    // =====================================================================
    // GROUP VISITS (Last Viewed Watermark)
    // =====================================================================

    async updateGroupVisit(orgId: string): Promise<void> {
        const userId = await getCurrentUserId();
        if (!userId) return;

        const { error } = await supabase
            .from('group_visits')
            .upsert(
                { org_id: orgId, user_id: userId, last_viewed_at: new Date().toISOString() },
                { onConflict: 'org_id,user_id' }
            );

        if (error) {
            logger.error('Error updating group visit', error);
        }
    },

    async getUnseenTasksCount(orgId: string): Promise<number> {
        const userId = await getCurrentUserId();
        if (!userId) return 0;

        // Get last visit time
        const { data: visitData } = await supabase
            .from('group_visits')
            .select('last_viewed_at')
            .eq('org_id', orgId)
            .eq('user_id', userId)
            .single();

        const lastViewedAt = visitData?.last_viewed_at;

        // If never visited, all are unseen
        let query = supabase
            .from('teacher_assigned_tasks')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('assigned_to', userId);

        if (lastViewedAt) {
            query = query.gt('created_at', lastViewedAt);
        }

        const { count, error } = await query;
        if (error) {
            logger.error('Error fetching unseen tasks count', error);
            return 0;
        }

        return count || 0;
    },

    // =====================================================================
    // PARENT PORTAL
    // =====================================================================

    async linkParentToStudent(studentId: string): Promise<ParentStudentLink> {
        const parentId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('parent_student_links')
            .insert({ parent_id: parentId, student_id: studentId })
            .select(`
                *,
                student:student_id (name, avatar)
            `)
            .single();

        if (error) {
            logger.error('Error linking parent to student', error);
            if (error.code === '23505') throw new Error('Ushbu farzand allaqachon bog\'langan');
            throw new Error('Farzandni bog\'lashda xatolik');
        }

        return {
            id: data.id,
            parentId: data.parent_id,
            studentId: data.student_id,
            orgId: data.org_id,
            studentName: data.student?.name,
            studentAvatar: data.student?.avatar,
            createdAt: data.created_at,
        };
    },

    async getMyLinkedStudents(): Promise<ParentStudentLink[]> {
        const parentId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('parent_student_links')
            .select(`
                *,
                student:student_id (name, avatar)
            `)
            .eq('parent_id', parentId);

        if (error) {
            logger.error('Error fetching linked students', error);
            throw new Error('Farzandlar ro\'yxatini yuklashda xatolik');
        }

        return (data || []).map((d: any) => ({
            id: d.id,
            parentId: d.parent_id,
            studentId: d.student_id,
            orgId: d.org_id,
            studentName: d.student?.name,
            studentAvatar: d.student?.avatar,
            createdAt: d.created_at,
        }));
    },

    async getStudentDataForParent(studentId: string): Promise<{ todos: any[]; routines: any[]; tasks: TeacherTask[]; user: any }> {
        const today = new Date().toISOString().split('T')[0];
        const [todosRes, routinesRes, tasksRes, userRes] = await Promise.all([
            supabase.from('todos').select('*').eq('user_id', studentId).order('created_at', { ascending: false }),
            supabase.from('routines').select('*').eq('user_id', studentId).eq('date', today),
            supabase.from('teacher_assigned_tasks').select('*, teacher:assigned_by (name)').eq('assigned_to', studentId),
            supabase.from('users').select('*').eq('id', studentId).single(),
        ]);

        return {
            todos: todosRes.data || [],
            routines: routinesRes.data || [],
            tasks: (tasksRes.data || []).map((d: any) => ({
                id: d.id, orgId: d.org_id, assignedBy: d.assigned_by, assignedTo: d.assigned_to,
                assignedByName: d.teacher?.name, title: d.title, description: d.description,
                deadline: d.deadline, completed: d.completed, completedAt: d.completed_at, createdAt: d.created_at,
            })),
            user: userRes.data,
        };
    },
};
