const { ayis } = require('../../data/ayis');
const { sampleDemands } = require('../../data/demands');

const DEFAULT_CITY = '北京';
const ALL_SERVICE_TYPE = '全部';
const SERVICE_ICON_BASE = '/assets/services/';
const CUSTOMER_SERVICE_ACTION_GROUP = 'customer_service_actions';
const AYI_SERVICE_TOP_ACTION_GROUP = 'ayi_service_top_actions';

const DEFAULT_CUSTOMER_TOP = {
  visible: true,
  searchPlaceholder: '阿姨姓名/籍贯/工种',
  description: ''
};

const DEFAULT_CUSTOMER_ACTIONS = [
  { id: 'default-demand', title: '发布需求', description: '顾问帮您匹配', targetType: 'demand', targetValue: '', large: true },
  { id: 'default-strict', title: '好阿姨严选', description: '认证优先展示', targetType: 'service', targetValue: ALL_SERVICE_TYPE }
];

const DEFAULT_FILTER_ITEMS = ['从业年限', '价格', '人气', '筛选'].map((title) => ({ id: title, title }));

const DEFAULT_AYI_LIST_CONFIG = {
  visible: true,
  showRating: true,
  showAge: true,
  showExperience: true,
  showHometown: true,
  showIntro: true,
  showSalary: true,
  showSchedule: true,
  emptyTitle: '暂时没有符合条件的阿姨',
  emptyDescription: '换个工种或关键词再试试。'
};

const DEFAULT_AYI_SERVICE_TOP_ACTIONS = [
  {
    id: 'default-ayi-profile',
    title: '加入阳光北亚',
    description: '完善个人资料',
    targetType: 'ayi_profile',
    targetValue: ''
  },
  {
    id: 'default-ayi-certs',
    title: '实名认证',
    description: '上传证件资料',
    targetType: 'ayi_certificates',
    targetValue: ''
  }
];

const DEFAULT_AYI_JOB_TOP = {
  visible: true,
  eyebrow: '找工作',
  title: '今日工作机会',
  description: '按工种、区域、预算筛选合适上户单。',
  profileButtonText: '完善资料',
  certButtonText: '上传证件'
};

const DEFAULT_AYI_JOB_LIST_CONFIG = {
  visible: true,
  showServiceType: true,
  showBudget: true,
  showAddress: true,
  showStartTime: true,
  showStatus: true,
  showFamilyInfo: true,
  emptyTitle: '暂时没有符合条件的工作',
  emptyDescription: '换个工种看看，后续后台可以随时更新今日工作。'
};

const DEFAULT_AYI_APPLY_CONFIG = {
  visible: true,
  applyButtonText: '申请接单',
  appliedButtonText: '已申请',
  profileRequiredMessage: '请先完善个人资料',
  successMessage: '已申请接单'
};

function parseConfig(value) {
  if (!value || typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function visible(value) {
  return value !== false && value !== 'false' && value !== 0 && value !== '0';
}

function sortedVisibleModules(modules) {
  return (modules || [])
    .filter((item) => item && visible(item.visible))
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
}

function buildCustomerTop(module) {
  const config = module ? parseConfig(module.targetValue) : {};
  return Object.assign({}, DEFAULT_CUSTOMER_TOP, {
    visible: module ? visible(module.visible) : DEFAULT_CUSTOMER_TOP.visible,
    searchPlaceholder: config.searchPlaceholder || config.placeholder || (module && module.title) || DEFAULT_CUSTOMER_TOP.searchPlaceholder,
    description: module && module.description ? module.description : DEFAULT_CUSTOMER_TOP.description
  });
}

function buildCustomerAyiListConfig(module) {
  const config = module ? parseConfig(module.targetValue) : {};
  return Object.assign({}, DEFAULT_AYI_LIST_CONFIG, {
    visible: module ? visible(module.visible) : DEFAULT_AYI_LIST_CONFIG.visible,
    showRating: config.showRating !== false,
    showAge: config.showAge !== false,
    showExperience: config.showExperience !== false,
    showHometown: config.showHometown !== false,
    showIntro: config.showIntro !== false,
    showSalary: config.showSalary !== false,
    showSchedule: config.showSchedule !== false,
    emptyTitle: config.emptyTitle || (module && module.title) || DEFAULT_AYI_LIST_CONFIG.emptyTitle,
    emptyDescription: config.emptyDescription || (module && module.description) || DEFAULT_AYI_LIST_CONFIG.emptyDescription
  });
}

function buildAyiJobTop(module) {
  return Object.assign({}, DEFAULT_AYI_JOB_TOP, {
    visible: module ? visible(module.visible) : DEFAULT_AYI_JOB_TOP.visible,
    eyebrow: (module && module.iconText) || DEFAULT_AYI_JOB_TOP.eyebrow,
    title: (module && module.title) || DEFAULT_AYI_JOB_TOP.title,
    description: (module && module.description) || DEFAULT_AYI_JOB_TOP.description,
    profileButtonText: (module && module.targetType) || DEFAULT_AYI_JOB_TOP.profileButtonText,
    certButtonText: (module && module.targetValue) || DEFAULT_AYI_JOB_TOP.certButtonText
  });
}

function parseFieldList(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function buildAyiJobListConfig(module) {
  const fields = parseFieldList(module && module.iconText);
  const hasFields = fields.length > 0;
  const includes = (key) => !hasFields || fields.indexOf(key) >= 0;
  return Object.assign({}, DEFAULT_AYI_JOB_LIST_CONFIG, {
    visible: module ? visible(module.visible) : DEFAULT_AYI_JOB_LIST_CONFIG.visible,
    showServiceType: includes('serviceType'),
    showBudget: includes('budget'),
    showAddress: includes('address'),
    showStartTime: includes('startTime'),
    showStatus: includes('status'),
    showFamilyInfo: includes('familyInfo'),
    emptyTitle: DEFAULT_AYI_JOB_LIST_CONFIG.emptyTitle,
    emptyDescription: (module && module.description) || DEFAULT_AYI_JOB_LIST_CONFIG.emptyDescription
  });
}

function buildAyiApplyConfig(module) {
  return Object.assign({}, DEFAULT_AYI_APPLY_CONFIG, {
    visible: module ? visible(module.visible) : DEFAULT_AYI_APPLY_CONFIG.visible,
    applyButtonText: (module && module.title) || DEFAULT_AYI_APPLY_CONFIG.applyButtonText,
    appliedButtonText: (module && module.iconText) || DEFAULT_AYI_APPLY_CONFIG.appliedButtonText,
    profileRequiredMessage: (module && module.description) || DEFAULT_AYI_APPLY_CONFIG.profileRequiredMessage,
    successMessage: (module && module.targetValue) || DEFAULT_AYI_APPLY_CONFIG.successMessage
  });
}

function defaultActionIcon(item) {
  const text = `${item.title || ''} ${item.description || ''}`;
  if (/发布|需求|接单|匹配/.test(text)) return `${SERVICE_ICON_BASE}match.svg`;
  if (/认证|证件|保障/.test(text)) return `${SERVICE_ICON_BASE}shield.svg`;
  if (/月嫂|母婴/.test(text)) return `${SERVICE_ICON_BASE}maternity.svg`;
  if (/育儿|婴儿/.test(text)) return `${SERVICE_ICON_BASE}baby.svg`;
  if (/保洁|清洁/.test(text)) return `${SERVICE_ICON_BASE}cleaning.svg`;
  return `${SERVICE_ICON_BASE}service-default.svg`;
}

Page({
  data: {
    role: '',
    noRole: true,
    isCustomer: false,
    isAyi: false,
    query: '',
    customerServiceTop: DEFAULT_CUSTOMER_TOP,
    customerServiceCity: DEFAULT_CITY,
    customerActions: DEFAULT_CUSTOMER_ACTIONS,
    ayiServiceTopActions: DEFAULT_AYI_SERVICE_TOP_ACTIONS,
    ayiJobTop: DEFAULT_AYI_JOB_TOP,
    ayiJobListConfig: DEFAULT_AYI_JOB_LIST_CONFIG,
    ayiApplyConfig: DEFAULT_AYI_APPLY_CONFIG,
    serviceTypeNames: [ALL_SERVICE_TYPE],
    serviceTypes: [],
    featureServices: [],
    activeType: ALL_SERVICE_TYPE,
    filterItems: DEFAULT_FILTER_ITEMS,
    ayiListConfig: DEFAULT_AYI_LIST_CONFIG,
    ayis,
    visibleAyis: ayis,
    noAyis: false,
    allDemands: [],
    demands: [],
    noDemands: false
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
    const role = app.globalData.role;
    const applications = app.globalData.applications || [];
    const sourceAyis = app.globalData.ayis && app.globalData.ayis.length ? app.globalData.ayis : ayis;
    const backendDemands = app.globalData.backendDemands && app.globalData.backendDemands.length ? app.globalData.backendDemands : sampleDemands;
    const modules = app.globalData.serviceModules || [];
    const visibleModules = sortedVisibleModules(modules);
    const serviceModules = visibleModules.filter((item) => item.moduleType === 'service');

    const customerTopModule = modules.find((item) => item && item.moduleType === 'highlight'
      && item.targetType === 'customer_service_search_top');
    const filterModules = visibleModules.filter((item) => item.moduleType === 'highlight'
      && item.targetType === 'customer_service_filter');
    const customerListModule = modules.find((item) => item && item.moduleType === 'highlight'
      && item.targetType === 'customer_service_ayi_list');
    const configuredCustomerActions = visibleModules.filter((item) => item.moduleType === 'shortcut'
      && item.targetValue === CUSTOMER_SERVICE_ACTION_GROUP);

    const ayiTopActionModules = visibleModules.filter((item) => item.moduleType === 'shortcut'
      && item.targetValue === AYI_SERVICE_TOP_ACTION_GROUP);
    const ayiJobTopModule = modules.find((item) => item && item.moduleType === 'highlight'
      && item.targetType === 'ayi_service_job_top');
    const ayiJobListModule = modules.find((item) => item && item.moduleType === 'highlight'
      && item.targetType === 'ayi_service_job_list');
    const ayiApplyModule = modules.find((item) => item && item.moduleType === 'highlight'
      && item.targetType === 'ayi_service_apply_action');

    const serviceTypeNames = [ALL_SERVICE_TYPE].concat(serviceModules.map((item) => item.title).filter(Boolean));
    const customerTop = buildCustomerTop(customerTopModule);
    const fallbackActions = DEFAULT_CUSTOMER_ACTIONS.concat(serviceModules.slice(0, 2).map((item) => ({
      id: `service-${item.id}`,
      type: item.title,
      title: item.title,
      description: item.description || item.summary || '查看相关服务',
      targetType: 'service',
      targetValue: item.title
    })));
    const customerActions = configuredCustomerActions.length
      ? configuredCustomerActions.map((item) => Object.assign({}, item, {
        description: item.description || '查看相关服务',
        displayIcon: '',
        large: false
      }))
      : fallbackActions;
    const filterItems = filterModules.length
      ? filterModules.map((item) => ({ id: item.id, title: item.title || item.description || '筛选' }))
      : DEFAULT_FILTER_ITEMS;
    const ayiServiceTopActions = ayiTopActionModules.length
      ? ayiTopActionModules.map((item) => Object.assign({}, item, {
        description: item.description || '',
        displayIcon: ''
      }))
      : DEFAULT_AYI_SERVICE_TOP_ACTIONS;

    const ayiApplyConfig = buildAyiApplyConfig(ayiApplyModule);

    this.setData({
      role,
      noRole: !role,
      isCustomer: role === 'customer',
      isAyi: role === 'ayi',
      customerServiceTop: customerTop,
      customerServiceCity: (app.globalData.companyProfile || {}).defaultCity || DEFAULT_CITY,
      serviceTypeNames,
      featureServices: serviceModules.slice(0, 2).map((item) => ({
        type: item.title,
        title: item.title,
        desc: item.description || item.summary || '查看相关服务'
      })),
      customerActions,
      filterItems,
      ayiListConfig: buildCustomerAyiListConfig(customerListModule),
      ayiServiceTopActions,
      ayiJobTop: buildAyiJobTop(ayiJobTopModule),
      ayiJobListConfig: buildAyiJobListConfig(ayiJobListModule),
      ayiApplyConfig
    });
    this.refreshCustomerActionIcons(customerActions);
    this.refreshAyiTopActionIcons(ayiServiceTopActions);

    const localDemands = app.globalData.demands || [];
    const merged = this.formatDemandList(localDemands.concat(backendDemands), applications, ayiApplyConfig);
    this.setData({
      ayis: sourceAyis,
      allDemands: merged
    });

    const requestedType = app.globalData.pendingServiceType || this.data.activeType || ALL_SERVICE_TYPE;
    app.globalData.pendingServiceType = '';
    const nextType = serviceTypeNames.includes(requestedType) ? requestedType : ALL_SERVICE_TYPE;
    if (role === 'ayi') {
      this.filterDemands(nextType, merged);
    } else {
      this.filterAyis(nextType, sourceAyis);
    }
    this.refreshServiceTypes();
  },

  refreshCustomerActionIcons(actions) {
    const app = getApp();
    const list = Array.isArray(actions) ? actions : [];
    Promise.all(list.map((item) => app.resolveImageForDisplay(item.iconImage, { storeId: `service-action-${item.id}` })
      .then((displayIcon) => Object.assign({}, item, { displayIcon: displayIcon || defaultActionIcon(item) }))
      .catch(() => Object.assign({}, item, { displayIcon: defaultActionIcon(item) }))))
      .then((items) => {
        this.setData({ customerActions: items });
      });
  },

  refreshAyiTopActionIcons(actions) {
    const app = getApp();
    const list = Array.isArray(actions) ? actions : [];
    Promise.all(list.map((item) => app.resolveImageForDisplay(item.iconImage, { storeId: `ayi-service-action-${item.id}` })
      .then((displayIcon) => Object.assign({}, item, { displayIcon: displayIcon || defaultActionIcon(item) }))
      .catch(() => Object.assign({}, item, { displayIcon: defaultActionIcon(item) }))))
      .then((items) => {
        this.setData({ ayiServiceTopActions: items });
      });
  },

  chooseRole() {
    wx.switchTab({
      url: '/pages/home/home'
    });
  },

  changeType(event) {
    const type = event.currentTarget.dataset.type;
    if (this.data.isAyi) {
      this.filterDemands(type);
    } else {
      this.filterAyis(type);
    }
  },

  useFeature(event) {
    const item = event.currentTarget.dataset.item || {};
    const targetType = String(item.targetType || event.currentTarget.dataset.targetType || '').toLowerCase();
    const targetValue = item.targetValue === CUSTOMER_SERVICE_ACTION_GROUP ? '' : (item.targetValue || event.currentTarget.dataset.type || item.type || '');
    if (targetType === 'demand' || targetValue === 'demand') {
      this.goDemand();
      return;
    }
    const type = targetValue === 'all' ? ALL_SERVICE_TYPE : (targetValue || item.title || ALL_SERVICE_TYPE);
    this.filterAyis(type);
    wx.showToast({
      title: type && type !== ALL_SERVICE_TYPE ? `已筛选${type}` : '已筛选',
      icon: 'none'
    });
  },

  useAyiTopAction(event) {
    const item = event.currentTarget.dataset.item || {};
    this.navigateAyiServiceTarget(item.targetType, item.targetValue, item.title);
  },

  navigateAyiServiceTarget(targetType, targetValue, title) {
    const groupSafeValue = targetValue === AYI_SERVICE_TOP_ACTION_GROUP ? '' : targetValue;
    const value = String(targetType || groupSafeValue || title || '').toLowerCase();
    if (['ayi_profile', 'profile', 'ayi-profile'].includes(value) || /资料|加入/.test(String(title || ''))) {
      this.goProfile();
      return;
    }
    if (['ayi_certificates', 'certificates', 'certs', 'ayi-certs'].includes(value) || /证件|认证/.test(String(title || ''))) {
      this.goCerts();
      return;
    }
    if (value === 'none' || value === '') return;
    wx.showToast({
      title: '暂未配置跳转',
      icon: 'none'
    });
  },

  showFilter(event) {
    wx.showToast({
      title: `${event.currentTarget.dataset.name}筛选后续接入`,
      icon: 'none'
    });
  },

  updateQuery(event) {
    this.setData({
      query: event.detail.value
    });
    this.filterAyis(this.data.activeType);
  },

  filterAyis(type, source) {
    const list = source || this.data.ayis || ayis;
    const keyword = this.data.query.trim();
    const visibleAyis = list.filter((item) => {
      const matchType = type === ALL_SERVICE_TYPE || item.role === type || item.serviceType === type;
      const matchKeyword = !keyword ||
        item.name.indexOf(keyword) >= 0 ||
        item.hometown.indexOf(keyword) >= 0 ||
        item.role.indexOf(keyword) >= 0;
      return matchType && matchKeyword;
    });
    this.setData({
      activeType: type,
      visibleAyis,
      noAyis: visibleAyis.length === 0
    });
    this.refreshServiceTypes(type);
  },

  filterDemands(type, source) {
    const list = source || this.data.allDemands || [];
    const demands = list.filter((item) => type === ALL_SERVICE_TYPE || item.serviceType === type);
    this.setData({
      activeType: type,
      demands,
      noDemands: demands.length === 0
    });
    this.refreshServiceTypes(type);
  },

  refreshServiceTypes(type) {
    const activeType = type || this.data.activeType;
    const serviceTypes = this.data.serviceTypeNames.map((name) => ({
      name,
      activeClass: name === activeType ? 'active' : ''
    }));
    this.setData({ serviceTypes });
  },

  formatDemandList(list, applications, applyConfig) {
    const config = applyConfig || this.data.ayiApplyConfig || DEFAULT_AYI_APPLY_CONFIG;
    return list.map((demand) => {
      const applied = applications.some((item) => item.demandId === demand.id);
      return Object.assign({}, demand, {
        applied,
        buttonClass: applied ? 'ghost-button' : 'primary-button',
        buttonText: applied ? config.appliedButtonText : config.applyButtonText,
        disabled: applied
      });
    });
  },

  goAyiDetail(event) {
    wx.navigateTo({
      url: `/pages/ayi-detail/ayi-detail?id=${event.currentTarget.dataset.id}`
    });
  },

  goDemand() {
    wx.navigateTo({
      url: '/pages/demand/demand'
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

  applyDemand(event) {
    const id = Number(event.currentTarget.dataset.id);
    const demand = this.data.demands.find((item) => item.id === id);
    if (!demand) return;

    const app = getApp();
    const profile = app.globalData.ayiProfile;
    const applyConfig = this.data.ayiApplyConfig || DEFAULT_AYI_APPLY_CONFIG;
    if (!profile) {
      wx.showToast({
        title: applyConfig.profileRequiredMessage,
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/ayi-profile/ayi-profile'
        });
      }, 700);
      return;
    }

    app.addApplication({
      demandId: demand.id,
      serviceType: demand.serviceType,
      customerAddress: `${demand.city} ${demand.address}`,
      startTime: demand.startTime,
      budget: demand.budget,
      familyInfo: demand.familyInfo,
      ayiName: profile.name,
      ayiPhone: profile.phone
    });

    wx.showToast({
      title: applyConfig.successMessage,
      icon: 'success'
    });
    this.onShow();
  }
});
