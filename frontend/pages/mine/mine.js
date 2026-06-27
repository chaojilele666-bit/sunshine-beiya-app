const DEFAULT_COMPANY_PROFILE = {
  companyLogo: '',
  customerServicePhone: ''
};

const DEFAULT_TOP = {
  customer: {
    visible: true,
    pageTitle: '客户中心',
    roleText: '客户',
    pageDesc: '需求、预约和顾问跟进'
  },
  ayi: {
    visible: true,
    pageTitle: '阿姨中心',
    roleText: '阿姨',
    pageDesc: '资料、证件和接单记录'
  },
  none: {
    visible: true,
    pageTitle: '个人中心',
    roleText: '未选择身份',
    pageDesc: '请选择客户或阿姨身份'
  }
};

const DEFAULT_CUSTOMER_SHORTCUTS = [
  { id: 'customer-demand', title: '发布需求', description: '填写家庭服务需求', iconText: '需', targetType: 'demand' },
  { id: 'customer-find-ayi', title: '找阿姨', description: '查看可预约阿姨', iconText: '找', targetType: 'service' },
  { id: 'customer-service', title: '联系客服', description: '电话沟通服务问题', iconText: '客', targetType: 'customer_service' },
  { id: 'customer-switch-role', title: '切换身份', description: '客户 / 阿姨身份切换', iconText: '切', targetType: 'switch_role' }
];

const DEFAULT_AYI_SHORTCUTS = [
  { id: 'ayi-profile', title: '我的资料', description: '经验、薪资、服务类型', iconText: '资', targetType: 'ayi_profile' },
  { id: 'ayi-certs', title: '我的证件', description: '身份证、健康证、技能证书', iconText: '证', targetType: 'ayi_certificates' },
  { id: 'ayi-work', title: '找工作', description: '查看客户需求', iconText: '工', targetType: 'work' },
  { id: 'ayi-applications', title: '我的接单', description: '查看申请记录', iconText: '接', targetType: 'applications' },
  { id: 'ayi-service', title: '联系客服', description: '电话沟通服务问题', iconText: '客', targetType: 'customer_service' },
  { id: 'ayi-switch-role', title: '切换身份', description: '客户 / 阿姨身份切换', iconText: '切', targetType: 'switch_role' }
];

const DEFAULT_CUSTOMER_TIP = {
  visible: true,
  text: '服务顾问会根据地址、预算和家庭情况推荐合适阿姨。'
};

const DEFAULT_SECTION = {
  demands: {
    visible: true,
    title: '我的需求',
    emptyTitle: '还没有发布需求',
    emptyDescription: '填写家庭情况后，顾问会帮你推荐合适阿姨。',
    buttonText: '发布需求'
  },
  appointments: {
    visible: true,
    title: '我的预约',
    emptyTitle: '还没有预约',
    emptyDescription: '先看看合适的阿姨，提交后顾问会联系确认。',
    buttonText: '去找阿姨'
  },
  applications: {
    visible: true,
    title: '我的接单',
    emptyTitle: '还没有接单申请',
    emptyDescription: '去服务页查看客户需求，选择合适的工作。',
    buttonText: '去找工作'
  }
};

const DEFAULT_AYI_REVIEW = {
  visible: true,
  title: '资料状态',
  incompleteText: '资料越完整，越容易获得面试机会。',
  pendingText: '资料正在审核中，请保持电话畅通。',
  approvedText: '资料已通过审核，可以继续查看合适工作。',
  rejectedText: '资料审核未通过，请补充或修改后再提交。',
  buttonText: '完善资料'
};

const DEFAULT_AYI_TIP = {
  visible: true,
  text: '完善资料和证件后，更容易获得顾问推荐。',
  buttonText: '完善资料',
  targetType: 'ayi_profile'
};

function visible(value) {
  return value !== false && value !== 'false' && value !== 0 && value !== '0';
}

function parseConfig(value) {
  if (!value || typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function sortedVisibleModules(modules) {
  return (modules || [])
    .filter((item) => item && visible(item.visible))
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
}

function findHighlight(modules, targetType) {
  return (modules || []).find((item) => item && item.moduleType === 'highlight'
    && item.targetType === targetType);
}

function buildTop(module, fallback) {
  return Object.assign({}, fallback, {
    visible: module ? visible(module.visible) : fallback.visible,
    pageTitle: (module && module.title) || fallback.pageTitle,
    roleText: (module && module.iconText) || fallback.roleText,
    pageDesc: (module && module.description) || fallback.pageDesc
  });
}

function buildShortcutList(modules, groupValue, fallback) {
  const list = sortedVisibleModules(modules).filter((item) => item.moduleType === 'shortcut'
    && item.targetValue === groupValue);
  return list.length ? list.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description || '',
    iconText: item.iconText || (item.title || '').slice(0, 1),
    iconImage: item.iconImage || '',
    displayIcon: '',
    targetType: item.targetType || 'none',
    targetValue: ''
  })) : fallback;
}

function buildTip(module, fallback) {
  return Object.assign({}, fallback, {
    visible: module ? visible(module.visible) : fallback.visible,
    text: (module && (module.description || module.title)) || fallback.text,
    buttonText: (module && module.iconText) || fallback.buttonText,
    targetType: (module && module.targetType) || fallback.targetType,
    targetValue: (module && module.targetValue) || ''
  });
}

function buildSection(module, fallback) {
  const config = module ? parseConfig(module.targetValue) : {};
  return Object.assign({}, fallback, {
    visible: module ? visible(module.visible) : fallback.visible,
    title: (module && module.title) || fallback.title,
    emptyTitle: config.emptyTitle || (module && module.iconText) || fallback.emptyTitle,
    emptyDescription: config.emptyDescription || (module && module.description) || fallback.emptyDescription,
    buttonText: config.buttonText || (module && module.targetValue && !Object.keys(config).length ? module.targetValue : '') || fallback.buttonText
  });
}

function buildReview(module) {
  const config = module ? parseConfig(module.targetValue) : {};
  return Object.assign({}, DEFAULT_AYI_REVIEW, {
    visible: module ? visible(module.visible) : DEFAULT_AYI_REVIEW.visible,
    title: (module && module.title) || DEFAULT_AYI_REVIEW.title,
    incompleteText: config.incompleteText || (module && module.description) || DEFAULT_AYI_REVIEW.incompleteText,
    pendingText: config.pendingText || DEFAULT_AYI_REVIEW.pendingText,
    approvedText: config.approvedText || DEFAULT_AYI_REVIEW.approvedText,
    rejectedText: config.rejectedText || DEFAULT_AYI_REVIEW.rejectedText,
    buttonText: config.buttonText || (module && module.iconText) || DEFAULT_AYI_REVIEW.buttonText
  });
}

function reviewMessageByStatus(status, config) {
  if (!status || status === '未完善') return config.incompleteText;
  if (status === '审核中' || status === '待审核') return config.pendingText;
  if (status === '已认证' || status === '审核通过') return config.approvedText;
  if (status === '审核未通过' || status === '未通过') return config.rejectedText;
  return config.incompleteText;
}

function defaultIconClass(index) {
  const classes = ['pink', 'green', 'blue', 'yellow', 'cyan', 'purple'];
  return classes[index % classes.length];
}

Page({
  data: {
    role: '',
    roleText: DEFAULT_TOP.none.roleText,
    avatarText: '我',
    pageTitle: DEFAULT_TOP.none.pageTitle,
    pageDesc: DEFAULT_TOP.none.pageDesc,
    topVisible: true,
    displayLogo: '',
    noRole: true,
    isCustomer: false,
    isAyi: false,
    profile: null,
    profileStatus: '未完善',
    reviewMessage: DEFAULT_AYI_REVIEW.incompleteText,
    customerShortcuts: DEFAULT_CUSTOMER_SHORTCUTS,
    ayiShortcuts: DEFAULT_AYI_SHORTCUTS,
    customerTip: DEFAULT_CUSTOMER_TIP,
    customerDemandSection: DEFAULT_SECTION.demands,
    customerAppointmentSection: DEFAULT_SECTION.appointments,
    ayiReviewConfig: DEFAULT_AYI_REVIEW,
    ayiApplicationSection: DEFAULT_SECTION.applications,
    ayiTip: DEFAULT_AYI_TIP,
    applications: [],
    noApplications: true,
    appointments: [],
    noAppointments: true,
    demands: [],
    noDemands: true,
    companyProfile: DEFAULT_COMPANY_PROFILE
  },

  onShow() {
    const app = getApp();
    this.refreshPage();
    app.loadBackendData({ force: true }).then(() => {
      this.refreshPage();
    });
  },

  refreshPage() {
    const app = getApp();
    const role = app.globalData.role || '';
    const modules = app.globalData.serviceModules || [];
    const companyProfile = Object.assign({}, DEFAULT_COMPANY_PROFILE, app.globalData.companyProfile || {});
    const profile = app.globalData.ayiProfile;
    const applications = app.globalData.applications || [];
    const appointments = app.globalData.appointments || [];
    const localDemands = app.globalData.demands || [];
    const topConfig = role === 'ayi'
      ? buildTop(findHighlight(modules, 'ayi_mine_top_user'), DEFAULT_TOP.ayi)
      : role === 'customer'
        ? buildTop(findHighlight(modules, 'customer_mine_top_user'), DEFAULT_TOP.customer)
        : DEFAULT_TOP.none;
    const profileStatus = profile ? profile.status : '未完善';
    const ayiReviewConfig = buildReview(findHighlight(modules, 'ayi_mine_review_status'));

    const customerShortcuts = buildShortcutList(modules, 'customer_mine_shortcuts', DEFAULT_CUSTOMER_SHORTCUTS)
      .map((item, index) => Object.assign({}, item, { iconClass: defaultIconClass(index) }));
    const ayiShortcuts = buildShortcutList(modules, 'ayi_mine_shortcuts', DEFAULT_AYI_SHORTCUTS)
      .map((item, index) => Object.assign({}, item, { iconClass: defaultIconClass(index) }));

    this.setData({
      role,
      roleText: topConfig.roleText,
      avatarText: role === 'ayi' ? '姨' : role === 'customer' ? '客' : '我',
      pageTitle: topConfig.pageTitle,
      pageDesc: topConfig.pageDesc,
      topVisible: topConfig.visible,
      noRole: !role,
      isCustomer: role === 'customer',
      isAyi: role === 'ayi',
      profile,
      profileStatus,
      reviewMessage: reviewMessageByStatus(profileStatus, ayiReviewConfig),
      customerShortcuts,
      ayiShortcuts,
      customerTip: buildTip(findHighlight(modules, 'customer_mine_tip_banner'), DEFAULT_CUSTOMER_TIP),
      customerDemandSection: buildSection(findHighlight(modules, 'customer_mine_demands'), DEFAULT_SECTION.demands),
      customerAppointmentSection: buildSection(findHighlight(modules, 'customer_mine_appointments'), DEFAULT_SECTION.appointments),
      ayiReviewConfig,
      ayiApplicationSection: buildSection(findHighlight(modules, 'ayi_mine_orders_applications'), DEFAULT_SECTION.applications),
      ayiTip: buildTip(findHighlight(modules, 'ayi_mine_tip_banner'), DEFAULT_AYI_TIP),
      applications,
      companyProfile,
      noApplications: applications.length === 0,
      appointments,
      noAppointments: appointments.length === 0,
      demands: localDemands,
      noDemands: localDemands.length === 0,
      displayLogo: ''
    });
    this.refreshShortcutIcons(customerShortcuts, 'customerShortcuts');
    this.refreshShortcutIcons(ayiShortcuts, 'ayiShortcuts');
    this.refreshLogo(companyProfile.companyLogo);
    if (role === 'customer') {
      this.loadCustomerDemands();
    }
  },

  refreshLogo(imageUrl) {
    const app = getApp();
    if (!imageUrl) return;
    app.resolveImageForDisplay(imageUrl, { storeId: 'mine-company-logo' })
      .then((displayLogo) => {
        this.setData({ displayLogo: displayLogo || '' });
      })
      .catch(() => {
        this.setData({ displayLogo: '' });
      });
  },

  refreshShortcutIcons(list, key) {
    const app = getApp();
    Promise.all((list || []).map((item) => app.resolveImageForDisplay(item.iconImage, { storeId: `mine-shortcut-${item.id}` })
      .then((displayIcon) => Object.assign({}, item, { displayIcon: displayIcon || '' }))
      .catch(() => Object.assign({}, item, { displayIcon: '' }))))
      .then((items) => {
        this.setData({ [key]: items });
      });
  },

  loadCustomerDemands() {
    const app = getApp();
    const accessList = app.getStoredCustomerDemandAccessList();
    if (!accessList.length) {
      this.setData({
        demands: [],
        noDemands: true
      });
      return;
    }

    Promise.all(accessList.map((item) => (
      app.fetchCustomerDemand(item.demandId, item.accessToken).catch(() => null)
    ))).then((list) => {
      const demands = list.filter(Boolean);
      this.setData({
        demands,
        noDemands: demands.length === 0
      });
    });
  },

  handleShortcut(event) {
    const item = event.currentTarget.dataset.item || {};
    this.navigateShortcut(item.targetType, item.title);
  },

  navigateShortcut(targetType, title) {
    const type = String(targetType || '').toLowerCase();
    if (type === 'demand' || /发布需求/.test(title || '')) {
      this.goDemand();
      return;
    }
    if (type === 'service' || type === 'find_ayi' || type === 'work' || /找阿姨|找工作/.test(title || '')) {
      this.goList();
      return;
    }
    if (type === 'customer_service' || /客服/.test(title || '')) {
      this.callService();
      return;
    }
    if (type === 'switch_role' || /切换/.test(title || '')) {
      this.switchRole();
      return;
    }
    if (type === 'ayi_profile' || /资料/.test(title || '')) {
      this.goProfile();
      return;
    }
    if (type === 'ayi_certificates' || type === 'certificates' || /证件|认证/.test(title || '')) {
      this.goCerts();
      return;
    }
    if (type === 'applications' || /接单|申请/.test(title || '')) {
      this.goApplications();
      return;
    }
    wx.showToast({
      title: '暂未配置跳转',
      icon: 'none'
    });
  },

  goList() {
    wx.switchTab({
      url: '/pages/service/service'
    });
  },

  goDemand() {
    wx.navigateTo({
      url: '/pages/demand/demand'
    });
  },

  goDemandDetail(event) {
    wx.navigateTo({
      url: `/pages/demand-detail/demand-detail?id=${event.currentTarget.dataset.id}`
    });
  },

  goProfile() {
    wx.navigateTo({
      url: '/pages/ayi-profile/ayi-profile'
    });
  },

  goCerts() {
    wx.navigateTo({
      url: '/pages/ayi-certs/ayi-certs'
    });
  },

  goHall() {
    wx.switchTab({
      url: '/pages/service/service'
    });
  },

  goApplications() {
    wx.navigateTo({
      url: '/pages/my-applications/my-applications'
    });
  },

  goAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  callService() {
    const phoneNumber = (this.data.companyProfile || {}).customerServicePhone;
    if (!phoneNumber) {
      wx.showToast({
        title: '客服电话暂未配置，请稍后再试。',
        icon: 'none'
      });
      return;
    }
    wx.makePhoneCall({ phoneNumber });
  },

  switchRole() {
    getApp().setRole('');
    wx.switchTab({
      url: '/pages/home/home'
    });
  }
});
