import { User, UserRole, CaseFile, Contract, CalendarEvent, Invoice, PLAN_LIMITS } from '../types';
import { pool, initDB } from './db';
import { ipService } from './ipService';

const CURRENT_USER_KEY = 'almohami_current_user';

export const storageService = {
  init: async () => {
    try {
      await initDB();
      console.log('✅ Database service initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      // Don't throw - allow app to continue, but login will fail
    }
  },
  
  testConnection: async (): Promise<boolean> => {
    try {
      await pool.query('SELECT NOW()');
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  getCurrentUserFresh: async (): Promise<User | null> => {
    const u = storageService.getCurrentUser();
    if (!u) return null;
    try {
      const r = await pool.query('SELECT * FROM users WHERE id = $1', [u.id]);
      if (r.rows.length === 0) return u;
      const raw = r.rows[0];
      const fresh: User = {
        id: raw.id,
        email: raw.email,
        name: raw.name,
        role: raw.role as UserRole,
        subscriptionPlan: raw.subscription_plan as any,
        subscriptionStatus: raw.subscription_status as any,
        avatar: raw.avatar,
        organizationOwnerId: raw.organization_owner_id
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(fresh));
      return fresh;
    } catch {
      return u;
    }
  },

  setCurrentUser: (user: User): void => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  login: async (email: string, password: string): Promise<User | null> => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Test database connection first
      try {
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection OK');
      } catch (connError) {
        console.error('❌ Database not connected:', connError);
        throw new Error('Database connection failed. Please refresh the page.');
      }
      
      // First, check if user exists
      const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      console.log('👤 User found:', userCheck.rows.length > 0);
      
      if (userCheck.rows.length > 0) {
        console.log('🔑 Stored password:', userCheck.rows[0].password);
        console.log('🔑 Provided password:', password);
        console.log('✅ Password match:', userCheck.rows[0].password === password);
      } else {
        console.log('❌ User not found with email:', email);
        return null;
      }
      
      // Now try the actual login query
      const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
      console.log('📊 Login query result:', result.rows.length, 'rows found');
      
      if (result.rows.length > 0) {
        const rawUser = result.rows[0];
        const user: User = {
          id: rawUser.id,
          email: rawUser.email,
          name: rawUser.name,
          role: rawUser.role as UserRole,
          subscriptionPlan: rawUser.subscription_plan as any,
          subscriptionStatus: rawUser.subscription_status as any,
          avatar: rawUser.avatar,
          organizationOwnerId: rawUser.organization_owner_id
        };
        // Bind IP to prevent account sharing
        await ipService.bindIPToUser(user.id);
        try {
          const ip = await ipService.getClientIP();
          if (ip) await pool.query('UPDATE users SET allowed_ip = $1 WHERE id = $2', [ip, user.id]);
        } catch (e) { /* non-blocking */ }
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        console.log('✅ Login successful for:', user.email);
        
        // Send welcome email
        try {
          const { emailService } = await import('./emailService');
          await emailService.sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't block login if email fails
        }
        
        return user;
      }
      
      console.log('❌ Login failed: Invalid email or password');
      return null;
    } catch (err) {
      console.error("❌ Login error:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      }
      throw err; // Re-throw so the UI can show the error
    }
  },

  logout: () => {
    const user = storageService.getCurrentUser();
    if (user) ipService.clearIPBinding(user.id);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const settings = await storageService.getGeneralSettings();
    if (settings.allowRegistrations === false) {
      throw new Error('التسجيل مغلق حالياً');
    }
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: UserRole.LAWYER,
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active'
    };

    const now = new Date().toISOString();
    await pool.query(
      'INSERT INTO users (id, email, name, password, role, subscription_plan, subscription_status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [newUser.id, newUser.email, newUser.name, password, newUser.role, newUser.subscriptionPlan, 'active', now]
    );

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    // Notify admin about new user registration
    const { notificationService } = await import('./notificationService');
    await notificationService.createNotification(
      'admin-1', // Admin user ID
      'admin',
      'مستخدم جديد',
      `تم تسجيل مستخدم جديد: ${name} (${email})`,
      '/admin-users',
      { userId: newUser.id, userName: name, userEmail: email }
    );

    return newUser;
  },

  updateUser: async (user: User, password?: string): Promise<void> => {
    let query = 'UPDATE users SET name = $1, email = $2, subscription_plan = $3 WHERE id = $4';
    let params = [user.name, user.email, user.subscriptionPlan, user.id];

    if (password) {
      query = 'UPDATE users SET name = $1, email = $2, subscription_plan = $3, password = $5 WHERE id = $4';
      params = [user.name, user.email, user.subscriptionPlan, user.id, password];
    }

    await pool.query(query, params);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  // --- PAYMENT & INVOICES ---

  submitPayment: async (plan: 'pro' | 'enterprise', receiptBase64: string): Promise<void> => {
    const user = storageService.getCurrentUser();
    if (!user) return;

    // Get pricing from database
    const pricing = await storageService.getPlanPricing();
    const amount = plan === 'pro' ? pricing.pro : pricing.enterprise;
    const invoiceId = Date.now().toString();
    
    // Create Pending Invoice
    await pool.query(
      'INSERT INTO invoices (id, date, amount, status, plan_name, user_id, receipt_data) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [invoiceId, new Date().toISOString(), amount, 'pending', plan, user.id, receiptBase64]
    );

    // Update User Status to Pending Approval
    await pool.query(
        'UPDATE users SET subscription_status = $1 WHERE id = $2',
        ['pending_approval', user.id]
    );
    
    // Update local storage to reflect pending status
    const updatedUser = { ...user, subscriptionStatus: 'pending_approval' } as User;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    
    // Note: Upgrade email will be sent when admin approves

    // Notify admin about new payment request
    const { notificationService } = await import('./notificationService');
    await notificationService.createNotification(
      'admin-1', // Admin user ID
      'invoice',
      'طلب تفعيل اشتراك جديد',
      `المستخدم ${user.name} (${user.email}) قدم طلب تفعيل باقة ${plan} بمبلغ ${amount} TND`,
      '/admin-dashboard',
      { invoiceId, userId: user.id, userName: user.name, userEmail: user.email, plan, amount }
    );
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const user = storageService.getCurrentUser();
    if (!user) return [];

    const result = await pool.query('SELECT * FROM invoices WHERE user_id = $1 ORDER BY date DESC', [user.id]);
    return result.rows.map(row => ({
      id: row.id,
      date: row.date,
      amount: parseFloat(row.amount),
      status: row.status as any,
      planName: row.plan_name,
      receiptData: row.receipt_data
    }));
  },

  // Admin Only
  getAllPendingInvoices: async (): Promise<Invoice[]> => {
    const result = await pool.query(`
        SELECT i.*, u.email as user_email, u.name as user_name 
        FROM invoices i 
        JOIN users u ON i.user_id = u.id 
        WHERE i.status = 'pending'
        ORDER BY i.date ASC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      date: row.date,
      amount: parseFloat(row.amount),
      status: row.status as any,
      planName: row.plan_name,
      receiptData: row.receipt_data,
      userEmail: row.user_email,
      userName: row.user_name
    }));
  },

  approveInvoice: async (invoiceId: string): Promise<void> => {
    const invResult = await pool.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
    if (invResult.rows.length === 0) return;
    const invoice = invResult.rows[0];
    const userId = invoice.user_id;
    const planName = invoice.plan_name;
    if (!userId || !planName) {
      console.error('approveInvoice: missing user_id or plan_name in invoice', invoice);
      return;
    }

    await pool.query("UPDATE invoices SET status = 'paid' WHERE id = $1", [invoiceId]);

    const userUpdate = await pool.query(
        "UPDATE users SET subscription_plan = $1, subscription_status = 'active' WHERE id = $2",
        [planName, userId]
    );
    if (userUpdate.rowCount === 0) {
      console.error('approveInvoice: user not found or not updated', userId);
    }

    const { notificationService } = await import('./notificationService');
    await notificationService.createNotification(
      userId,
      'invoice',
      'تم تفعيل اشتراكك',
      `تم تفعيل باقة ${planName} بنجاح. يمكنك الآن الاستفادة من جميع الميزات.`,
      '/settings',
      { invoiceId, planName }
    );
  },

  rejectInvoice: async (invoiceId: string): Promise<void> => {
     const invResult = await pool.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
     if (invResult.rows.length === 0) return;
     const invoice = invResult.rows[0];

     await pool.query("UPDATE invoices SET status = 'rejected' WHERE id = $1", [invoiceId]);
     
     // Send notification to user
     const { notificationService } = await import('./notificationService');
     await notificationService.createNotification(
       invoice.user_id,
       'invoice',
       'تم رفض طلب التفعيل',
       `تم رفض طلب تفعيل باقة ${invoice.plan_name}. يرجى التحقق من وصل التحويل وإعادة المحاولة.`,
       '/settings',
       { invoiceId, planName: invoice.plan_name }
     );
  },

  // --- CASES ---

  getCaseById: async (caseId: string): Promise<CaseFile | null> => {
    const user = storageService.getCurrentUser();
    if (!user) return null;
    const cases = await storageService.getCases();
    let found = cases.find(c => c.id === caseId);
    if (found) return found;
    if (user.subscriptionPlan === 'enterprise') {
      const ownerId = user.organizationOwnerId || user.id;
      const team = await storageService.getTeamMembers(ownerId);
      for (const m of team) {
        const mc = await storageService.getCasesByUserId(m.id);
        found = mc.find(c => c.id === caseId) || null;
        if (found) return found;
      }
    }
    return null;
  },

  mapCaseRow: (row: any): CaseFile => ({
    id: row.id,
    title: row.title,
    clientName: row.client_name,
    type: row.type as any,
    status: row.status as any,
    dateCreated: row.date_created,
    documents: row.documents || [],
    analysis: row.analysis,
    chatHistory: row.chat_history || [],
    userId: row.user_id,
    assignedToUserId: row.assigned_to_user_id,
    createdByUserId: row.created_by_user_id
  }),

  getCasesByUserId: async (userId: string): Promise<CaseFile[]> => {
    try {
      const result = await pool.query('SELECT * FROM cases WHERE user_id = $1', [userId]);
      return result.rows.map((row: any) => storageService.mapCaseRow(row));
    } catch (err) {
      console.error('Get cases by user error:', err);
      return [];
    }
  },

  getCases: async (): Promise<CaseFile[]> => {
    const user = storageService.getCurrentUser();
    if (!user) return [];

    try {
      let query: string;
      let params: any[];

      if (user.role === UserRole.ADMIN) {
        query = 'SELECT * FROM cases';
        params = [];
      } else if (user.subscriptionPlan === 'enterprise' && user.organizationOwnerId) {
        // Membre équipe: ne voit que les affaires qui lui sont affectées
        query = 'SELECT * FROM cases WHERE assigned_to_user_id = $1';
        params = [user.id];
      } else {
        // Owner ou usage normal: ses propres affaires (pour enterprise owner = toute l'org)
        query = 'SELECT * FROM cases WHERE user_id = $1';
        params = [user.id];
      }

      const result = await pool.query(query, params);
      return result.rows.map((row: any) => storageService.mapCaseRow(row));
    } catch (err) {
      console.error("Get cases error:", err);
      return [];
    }
  },

  getOrgCasesForOwner: async (ownerId: string): Promise<CaseFile[]> => {
    try {
      const result = await pool.query('SELECT * FROM cases WHERE user_id = $1 ORDER BY date_created DESC', [ownerId]);
      return result.rows.map((row: any) => storageService.mapCaseRow(row));
    } catch (err) {
      console.error('Get org cases error:', err);
      return [];
    }
  },

  revokeCaseAssignment: async (caseId: string, ownerId: string): Promise<void> => {
    const user = storageService.getCurrentUser();
    if (!user) throw new Error('غير مصرح');
    const owner = user.organizationOwnerId || user.id;
    if (owner !== ownerId) throw new Error('غير مصرح');

    const caseRes = await pool.query('SELECT * FROM cases WHERE id = $1 AND user_id = $2', [caseId, ownerId]);
    if (caseRes.rows.length === 0) throw new Error('القضية غير موجودة');

    await pool.query('UPDATE cases SET assigned_to_user_id = NULL WHERE id = $1', [caseId]);
  },

  assignCaseToUser: async (caseId: string, assignToUserId: string, assignerId: string): Promise<void> => {
    const user = storageService.getCurrentUser();
    if (!user) throw new Error('غير مصرح');

    const caseRes = await pool.query('SELECT * FROM cases WHERE id = $1', [caseId]);
    if (caseRes.rows.length === 0) throw new Error('القضية غير موجودة');
    const c = caseRes.rows[0];
    if (c.user_id !== (user.organizationOwnerId || user.id)) throw new Error('لا يمكنك إسناد هذه القضية');

    await pool.query('UPDATE cases SET assigned_to_user_id = $1 WHERE id = $2', [assignToUserId, caseId]);

    const assignee = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [assignToUserId]);
    const assigner = await pool.query('SELECT name FROM users WHERE id = $1', [assignerId]);
    if (assignee.rows.length > 0 && assigner.rows.length > 0) {
      const { notificationService } = await import('./notificationService');
      const { emailService } = await import('./emailService');
      await notificationService.createNotification(
        assignToUserId,
        'case',
        'تم إسناد قضية إليك',
        `${assigner.rows[0].name} أسند إليك القضية: ${c.title}`,
        '/#cases',
        { caseId, caseTitle: c.title }
      );
      await emailService.sendCaseAssignedEmail(
        assignee.rows[0].email,
        assignee.rows[0].name,
        c.title,
        assigner.rows[0].name
      );
    }
  },

  checkUsageLimit: async (type: 'cases' | 'contracts'): Promise<boolean> => {
    const user = storageService.getCurrentUser();
    if (!user) return false;
    
    const planLimits = await storageService.getPlanLimits();
    const plan = user.subscriptionPlan || 'basic';
    const limit = planLimits[plan]?.[type] ?? planLimits.basic[type];
    
    if (limit > 9000) return true;

    const countUserId = user.organizationOwnerId || user.id;
    let count = 0;
    if (type === 'cases') {
       const res = await pool.query('SELECT COUNT(*) FROM cases WHERE user_id = $1', [countUserId]);
       count = parseInt(res.rows[0].count);
    } else {
       const res = await pool.query('SELECT COUNT(*) FROM contracts WHERE user_id = $1', [user.id]);
       count = parseInt(res.rows[0].count);
    }

    return count < limit;
  },

  addCase: async (newCase: CaseFile): Promise<{ pendingApproval: boolean }> => {
    const user = storageService.getCurrentUser();
    if (!user) return { pendingApproval: false };

    const ownerId = user.organizationOwnerId || user.id;
    const isTeamMember = !!user.organizationOwnerId;

    const status = isTeamMember ? 'pending' : (newCase.status || 'active');
    const userIdForCase = isTeamMember ? ownerId : user.id;
    const createdBy = isTeamMember ? user.id : null;

    await pool.query(
      `INSERT INTO cases (id, title, client_name, type, status, date_created, documents, analysis, chat_history, user_id, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        newCase.id,
        newCase.title,
        newCase.clientName,
        newCase.type,
        status,
        newCase.dateCreated,
        JSON.stringify(newCase.documents),
        newCase.analysis || '',
        JSON.stringify(newCase.chatHistory || []),
        userIdForCase,
        createdBy
      ]
    );

    if (isTeamMember) {
      const { notificationService } = await import('./notificationService');
      await notificationService.createNotification(
        ownerId,
        'case',
        'طلب إنشاء قضية جديدة',
        `${user.name} يطلب إنشاء قضية "${newCase.title}" (الموكل: ${newCase.clientName}). اضغط للموافقة أو الرفض.`,
        '/#pending-cases',
        { caseId: newCase.id, caseTitle: newCase.title, creatorId: user.id, creatorName: user.name, clientName: newCase.clientName }
      );
    }

    return { pendingApproval: isTeamMember };
  },

  getPendingCaseRequests: async (ownerId: string): Promise<CaseFile[]> => {
    try {
      const result = await pool.query(
        'SELECT * FROM cases WHERE user_id = $1 AND status = $2 AND created_by_user_id IS NOT NULL ORDER BY date_created DESC',
        [ownerId, 'pending']
      );
      return result.rows.map((row: any) => storageService.mapCaseRow(row));
    } catch (err) {
      console.error('Get pending cases error:', err);
      return [];
    }
  },

  approveCaseRequest: async (caseId: string, ownerId: string): Promise<void> => {
    const user = storageService.getCurrentUser();
    if (!user || (user.organizationOwnerId || user.id) !== ownerId) throw new Error('غير مصرح');

    const caseRes = await pool.query('SELECT * FROM cases WHERE id = $1 AND user_id = $2 AND status = $3', [caseId, ownerId, 'pending']);
    if (caseRes.rows.length === 0) throw new Error('القضية غير موجودة');

    await pool.query(
      'UPDATE cases SET status = $1, assigned_to_user_id = created_by_user_id WHERE id = $2',
      ['active', caseId]
    );

    const creatorId = caseRes.rows[0].created_by_user_id;
    if (creatorId) {
      const { notificationService } = await import('./notificationService');
      await notificationService.createNotification(
        creatorId,
        'success',
        'تمت الموافقة على القضية',
        `تمت الموافقة على قضيتك "${caseRes.rows[0].title}". يمكنك الآن عرضها وإضافة المستندات.`,
        '/#cases'
      );
    }
  },

  rejectCaseRequest: async (caseId: string, ownerId: string): Promise<void> => {
    const user = storageService.getCurrentUser();
    if (!user || (user.organizationOwnerId || user.id) !== ownerId) throw new Error('غير مصرح');

    const caseRes = await pool.query('SELECT * FROM cases WHERE id = $1 AND user_id = $2 AND status = $3', [caseId, ownerId, 'pending']);
    if (caseRes.rows.length === 0) throw new Error('القضية غير موجودة');

    const creatorId = caseRes.rows[0].created_by_user_id;
    const caseTitle = caseRes.rows[0].title;

    await pool.query('DELETE FROM cases WHERE id = $1', [caseId]);

    if (creatorId) {
      const { notificationService } = await import('./notificationService');
      await notificationService.createNotification(
        creatorId,
        'error',
        'تم رفض طلب القضية',
        `تم رفض طلب إنشاء القضية "${caseTitle}" من قبل مدير المكتب.`,
        '/#cases'
      );
    }
  },

  updateCase: async (updatedCase: CaseFile): Promise<void> => {
    await pool.query(
      `UPDATE cases SET title = $1, client_name = $2, type = $3, status = $4, documents = $5, analysis = $6, chat_history = $7 WHERE id = $8`,
      [
        updatedCase.title,
        updatedCase.clientName,
        updatedCase.type,
        updatedCase.status,
        JSON.stringify(updatedCase.documents),
        updatedCase.analysis || '',
        JSON.stringify(updatedCase.chatHistory || []),
        updatedCase.id
      ]
    );
  },

  deleteCase: async (caseId: string): Promise<void> => {
    await pool.query('DELETE FROM cases WHERE id = $1', [caseId]);
  },

  // --- CONTRACTS ---

  getContracts: async (): Promise<Contract[]> => {
    const user = storageService.getCurrentUser();
    if (!user) return [];
    
    const result = await pool.query('SELECT * FROM contracts WHERE user_id = $1', [user.id]);
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      type: row.type,
      parties: row.parties,
      content: row.content,
      dateCreated: row.date_created
    }));
  },

  saveContract: async (contract: Contract): Promise<void> => {
    const user = storageService.getCurrentUser();
    if (!user) return;

    await pool.query(
      'INSERT INTO contracts (id, title, type, parties, content, date_created, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [contract.id, contract.title, contract.type, contract.parties, contract.content, contract.dateCreated, user.id]
    );
  },

  deleteContract: async (id: string): Promise<void> => {
     await pool.query('DELETE FROM contracts WHERE id = $1', [id]);
  },

  // --- EVENTS ---

  getEvents: async (): Promise<CalendarEvent[]> => {
    const user = storageService.getCurrentUser();
    if (!user) return [];

    let query: string;
    let params: any[];

    if (user.subscriptionPlan === 'enterprise' && !user.organizationOwnerId) {
      const team = await storageService.getTeamMembers(user.id);
      const userIds = [user.id, ...team.map(m => m.id)];
      const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ');
      query = `
        SELECT e.*, c.title as case_title, u.name as user_name
        FROM events e
        LEFT JOIN cases c ON e.case_id = c.id
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.user_id IN (${placeholders})
        ORDER BY e.date, e.time
      `;
      params = userIds;
    } else {
      query = `
        SELECT e.*, c.title as case_title, u.name as user_name
        FROM events e
        LEFT JOIN cases c ON e.case_id = c.id
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.user_id = $1
        ORDER BY e.date, e.time
      `;
      params = [user.id];
    }

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      date: row.date,
      time: row.time || undefined,
      type: row.type as any,
      description: row.description,
      caseId: row.case_id,
      caseTitle: row.case_title,
      userId: row.user_id,
      userName: row.user_name
    }));
  },

  addEvent: async (event: CalendarEvent): Promise<void> => {
    const user = storageService.getCurrentUser();
    if (!user) return;
    
    await pool.query(
      'INSERT INTO events (id, title, date, time, type, description, user_id, case_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [event.id, event.title, event.date, event.time || null, event.type, event.description, user.id, event.caseId || null]
    );
  },

  deleteEvent: async (id: string): Promise<void> => {
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
  },
  
  getAllUsers: async (): Promise<User[]> => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE role != $1', ['ADMIN']);
      return result.rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        subscriptionPlan: row.subscription_plan as any,
        subscriptionStatus: row.subscription_status as any,
        avatar: row.avatar
      }));
    } catch (err) {
      console.error("Get all users error:", err);
      return [];
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  },

  upgradeUserPlan: async (userId: string, plan: 'basic' | 'pro' | 'enterprise'): Promise<void> => {
    await pool.query(
      'UPDATE users SET subscription_plan = $1, subscription_status = $2 WHERE id = $3',
      [plan, 'active', userId]
    );
  },

  // System Settings
  getSystemSetting: async (key: string): Promise<any> => {
    try {
      const result = await pool.query('SELECT value FROM system_settings WHERE key = $1', [key]);
      if (result.rows.length > 0) {
        const value = result.rows[0].value;
        return typeof value === 'string' ? JSON.parse(value) : value;
      }
      return null;
    } catch (err) {
      console.error("Get system setting error:", err);
      return null;
    }
  },

  setSystemSetting: async (key: string, value: any): Promise<void> => {
    try {
      await pool.query(
        `INSERT INTO system_settings (key, value, updated_at) 
         VALUES ($1, $2, $3)
         ON CONFLICT (key) 
         DO UPDATE SET value = $2, updated_at = $3`,
        [key, JSON.stringify(value), new Date().toISOString()]
      );
    } catch (err) {
      console.error("Set system setting error:", err);
      throw err;
    }
  },

  getPlanPricing: async (): Promise<{ pro: number; enterprise: number }> => {
    const pricing = await storageService.getSystemSetting('pricing');
    return pricing || { pro: 59, enterprise: 199 }; // Default values
  },

  getGeneralSettings: async (): Promise<{ maintenanceMode?: boolean; allowRegistrations?: boolean; appName?: string; geminiApiKey?: string; notificationPollingInterval?: number }> => {
    const s = await storageService.getSystemSetting('general_settings');
    return s || { maintenanceMode: false, allowRegistrations: true, appName: 'المحامي' };
  },

  getPlanLimits: async (): Promise<typeof PLAN_LIMITS> => {
    const limits = await storageService.getSystemSetting('plan_limits');
    if (!limits) return PLAN_LIMITS;
    const merged = { ...PLAN_LIMITS };
    for (const plan of ['basic', 'pro', 'enterprise'] as const) {
      merged[plan] = { ...PLAN_LIMITS[plan], ...(limits[plan] || {}) };
    }
    return merged;
  },

  // --- IP VERIFICATION OTP ---
  createIpVerificationOtp: async (userId: string, userEmail: string, userName: string, newIp: string): Promise<string> => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const id = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
    await pool.query(
      `DELETE FROM ip_verification_otp WHERE user_id = $1`,
      [userId]
    );
    await pool.query(
      `INSERT INTO ip_verification_otp (id, user_id, otp, new_ip, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, userId, otp, newIp, expiresAt, new Date().toISOString()]
    );
    const { emailService } = await import('./emailService');
    await emailService.sendIpVerificationOtp(userEmail, userName, otp);
    return otp;
  },

  verifyIpOtp: async (userId: string, otp: string): Promise<boolean> => {
    const result = await pool.query(
      `SELECT * FROM ip_verification_otp WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (result.rows.length === 0) return false;
    const row = result.rows[0];
    if (row.otp !== otp) return false;
    if (new Date(row.expires_at) < new Date()) return false;
    await pool.query('DELETE FROM ip_verification_otp WHERE user_id = $1', [userId]);
    await pool.query('UPDATE users SET allowed_ip = $1 WHERE id = $2', [row.new_ip, userId]);
    ipService.setAllowedIP(userId, row.new_ip);
    return true;
  },

  // --- PASSWORD RESET (forgot password with OTP) ---
  createPasswordResetOtp: async (email: string): Promise<{ ok: boolean; message?: string }> => {
    const userRes = await pool.query('SELECT id, email, name FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return { ok: false, message: 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني' };
    }
    const user = userRes.rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const id = `pw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await pool.query('DELETE FROM password_reset_otp WHERE email = $1', [email]);
    await pool.query(
      `INSERT INTO password_reset_otp (id, email, otp, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [id, email, otp, expiresAt, new Date().toISOString()]
    );
    const { emailService } = await import('./emailService');
    await emailService.sendPasswordResetOtp(user.email, user.name, otp);
    return { ok: true };
  },

  resetPasswordWithOtp: async (email: string, otp: string, newPassword: string): Promise<{ ok: boolean; message?: string }> => {
    const res = await pool.query(
      'SELECT * FROM password_reset_otp WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    if (res.rows.length === 0) return { ok: false, message: 'رمز التحقق غير صالح أو منتهي الصلاحية' };
    const row = res.rows[0];
    if (row.otp !== otp) return { ok: false, message: 'رمز التحقق غير صحيح' };
    if (new Date(row.expires_at) < new Date()) {
      await pool.query('DELETE FROM password_reset_otp WHERE email = $1', [email]);
      return { ok: false, message: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد' };
    }
    await pool.query('DELETE FROM password_reset_otp WHERE email = $1', [email]);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [newPassword, email]);
    return { ok: true };
  },

  // --- SIGNUP EMAIL VERIFICATION OTP ---
  createSignupEmailOtp: async (email: string, name: string): Promise<{ ok: boolean; message?: string }> => {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return { ok: false, message: 'هذا البريد الإلكتروني مستخدم بالفعل' };
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const id = `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await pool.query('DELETE FROM signup_email_otp WHERE email = $1', [email.trim().toLowerCase()]);
    await pool.query(
      `INSERT INTO signup_email_otp (id, email, otp, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [id, email.trim().toLowerCase(), otp, expiresAt, new Date().toISOString()]
    );
    const { emailService } = await import('./emailService');
    await emailService.sendSignupVerificationOtp(email.trim(), name, otp);
    return { ok: true };
  },

  verifySignupEmailOtp: async (email: string, otp: string): Promise<{ ok: boolean; message?: string }> => {
    const res = await pool.query(
      'SELECT * FROM signup_email_otp WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      [email.trim().toLowerCase()]
    );
    if (res.rows.length === 0) return { ok: false, message: 'رمز التحقق غير صالح أو منتهي الصلاحية' };
    const row = res.rows[0];
    if (row.otp !== otp) return { ok: false, message: 'رمز التحقق غير صحيح' };
    if (new Date(row.expires_at) < new Date()) {
      await pool.query('DELETE FROM signup_email_otp WHERE email = $1', [email.trim().toLowerCase()]);
      return { ok: false, message: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد' };
    }
    await pool.query('DELETE FROM signup_email_otp WHERE email = $1', [email.trim().toLowerCase()]);
    return { ok: true };
  },

  // --- ENTERPRISE TEAM ---
  getTeamMembers: async (ownerId: string): Promise<User[]> => {
    const mapRow = (row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role as UserRole,
      subscriptionPlan: row.subscription_plan as any,
      subscriptionStatus: row.subscription_status as any,
      avatar: row.avatar,
      organizationOwnerId: row.organization_owner_id
    });
    try {
      let result = await pool.query(
        'SELECT * FROM users WHERE id = $1 OR organization_owner_id = $1 ORDER BY id',
        [ownerId]
      );
      if (result.rows.length === 0) {
        const u = storageService.getCurrentUser();
        if (u?.email) {
          const byEmail = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
          if (byEmail.rows.length > 0) {
            const altId = byEmail.rows[0].id;
            if (altId !== ownerId) {
              result = await pool.query(
                'SELECT * FROM users WHERE id = $1 OR organization_owner_id = $1 ORDER BY id',
                [altId]
              );
            }
          }
        }
      }
      return result.rows.map(mapRow);
    } catch (err) {
      console.error('Get team members error:', err);
      return [];
    }
  },

  inviteTeamMember: async (ownerId: string, email: string, baseUrl: string): Promise<void> => {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) throw new Error('البريد الإلكتروني مستخدم بالفعل');

    const pending = await pool.query('SELECT * FROM team_invites WHERE owner_id = $1 AND email = $2 AND status = $3', [ownerId, email, 'pending']);
    if (pending.rows.length > 0) throw new Error('تم إرسال دعوة سابقة لهذا البريد. يرجى الانتظار أو إلغاء الدعوة.');

    const current = await pool.query('SELECT COUNT(*) FROM users WHERE organization_owner_id = $1', [ownerId]);
    const invitedCount = await pool.query('SELECT COUNT(*) FROM team_invites WHERE owner_id = $1 AND status = $2', [ownerId, 'pending']);
    if (parseInt(current.rows[0].count) + parseInt(invitedCount.rows[0].count) >= 3) {
      throw new Error('تم الوصول لحد الباقة (3 محامين). راجع إعدادات المكتب.');
    }

    const token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const id = `ti_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await pool.query(
      `INSERT INTO team_invites (id, owner_id, email, token, expires_at, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, ownerId, email, token, expiresAt, 'pending', new Date().toISOString()]
    );

    const inviteLink = `${baseUrl.replace(/\/$/, '')}/#invite/${token}`;
    const owner = await pool.query('SELECT name FROM users WHERE id = $1', [ownerId]);
    const inviterName = owner.rows[0]?.name || 'مدير المكتب';
    const { emailService } = await import('./emailService');
    await emailService.sendTeamInviteEmail(email, inviterName, inviteLink);
  },

  getPendingInvites: async (ownerId: string): Promise<{ id: string; email: string; createdAt: string }[]> => {
    const result = await pool.query(
      `SELECT id, email, created_at FROM team_invites WHERE owner_id = $1 AND status = $2 ORDER BY created_at DESC`,
      [ownerId, 'pending']
    );
    return result.rows.map(r => ({ id: r.id, email: r.email, createdAt: r.created_at }));
  },

  cancelInvite: async (inviteId: string, ownerId: string): Promise<void> => {
    await pool.query('UPDATE team_invites SET status = $1 WHERE id = $2 AND owner_id = $3', ['cancelled', inviteId, ownerId]);
  },

  removeTeamMember: async (memberId: string, ownerId: string): Promise<void> => {
    const user = storageService.getCurrentUser();
    if (!user) throw new Error('غير مصرح');
    if ((user.organizationOwnerId || user.id) !== ownerId) throw new Error('غير مصرح');
    if (memberId === ownerId) throw new Error('لا يمكن إزالة مدير المكتب');

    await pool.query(
      'UPDATE users SET organization_owner_id = NULL, subscription_plan = $1 WHERE id = $2 AND organization_owner_id = $3',
      ['basic', memberId, ownerId]
    );
  },

  getInviteByToken: async (token: string): Promise<{ ownerId: string; email: string; inviterName: string } | null> => {
    const result = await pool.query(
      `SELECT ti.owner_id, ti.email, u.name as inviter_name 
       FROM team_invites ti 
       JOIN users u ON ti.owner_id = u.id 
       WHERE ti.token = $1 AND ti.status = $2 AND ti.expires_at > $3`,
      [token, 'pending', new Date().toISOString()]
    );
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return { ownerId: r.owner_id, email: r.email, inviterName: r.inviter_name };
  },

  acceptTeamInvite: async (token: string, name: string, password: string): Promise<User> => {
    const invite = await pool.query(
      'SELECT * FROM team_invites WHERE token = $1 AND status = $2 AND expires_at > $3',
      [token, 'pending', new Date().toISOString()]
    );
    if (invite.rows.length === 0) throw new Error('الدعوة غير صالحة أو منتهية الصلاحية');

    const row = invite.rows[0];
    const newUser: User = {
      id: `tm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: row.email,
      name,
      role: UserRole.LAWYER,
      subscriptionPlan: 'enterprise',
      subscriptionStatus: 'active',
      organizationOwnerId: row.owner_id
    };
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO users (id, email, name, password, role, subscription_plan, subscription_status, organization_owner_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [newUser.id, row.email, name, password, 'LAWYER', 'enterprise', 'active', row.owner_id, now]
    );
    await pool.query('UPDATE team_invites SET status = $1 WHERE id = $2', ['accepted', row.id]);
    return newUser;
  },

  addTeamMember: async (ownerId: string, email: string, name: string, password: string): Promise<User> => {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) throw new Error('البريد الإلكتروني مستخدم بالفعل');

    const current = await pool.query('SELECT COUNT(*) FROM users WHERE organization_owner_id = $1', [ownerId]);
    if (parseInt(current.rows[0].count) >= 3) {
      throw new Error('تم الوصول لحد الباقة (3 محامين). راجع إعدادات المكتب.');
    }

    const newUser: User = {
      id: `tm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      role: UserRole.LAWYER,
      subscriptionPlan: 'enterprise',
      subscriptionStatus: 'active'
    };
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO users (id, email, name, password, role, subscription_plan, subscription_status, organization_owner_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [newUser.id, email, name, password, 'LAWYER', 'enterprise', 'active', ownerId, now]
    );
    return newUser;
  },

  sendTeamGroupMessage: async (ownerId: string, fromUserId: string, message: string): Promise<void> => {
    await pool.query(
      `INSERT INTO team_chat_messages (id, owner_id, from_user_id, message, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [`tcm_${Date.now()}`, ownerId, fromUserId, message, new Date().toISOString()]
    );
  },

  getTeamGroupMessages: async (ownerId: string): Promise<{ id: string; fromUserId: string; fromUserName: string; text: string; createdAt: string }[]> => {
    const result = await pool.query(
      `SELECT m.id, m.from_user_id, m.message, m.created_at, u.name as from_name
       FROM team_chat_messages m
       JOIN users u ON m.from_user_id = u.id
       WHERE m.owner_id = $1
       ORDER BY m.created_at ASC`,
      [ownerId]
    );
    return result.rows.map(r => ({
      id: r.id,
      fromUserId: r.from_user_id,
      fromUserName: r.from_name,
      text: r.message,
      createdAt: r.created_at
    }));
  },

  sendInternalMessage: async (fromId: string, toId: string, message: string): Promise<void> => {
    await pool.query(
      `INSERT INTO internal_messages (id, from_user_id, to_user_id, message, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [`msg_${Date.now()}`, fromId, toId, message, new Date().toISOString()]
    );
  },

  getInternalMessages: async (userId: string, otherUserId: string): Promise<{ from: string; to: string; text: string; createdAt: string }[]> => {
    const result = await pool.query(
      `SELECT from_user_id, to_user_id, message, created_at FROM internal_messages
       WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)
       ORDER BY created_at ASC`,
      [userId, otherUserId]
    );
    return result.rows.map(r => ({
      from: r.from_user_id,
      to: r.to_user_id,
      text: r.message,
      createdAt: r.created_at
    }));
  }
};
