const SERVICE_ICON_BASE = '/assets/services/';
const SERVICE_ICON_MAP = [
  { keywords: ['育儿嫂', '育儿', '婴儿'], icon: 'baby.svg' },
  { keywords: ['月嫂', '母婴', '新生儿'], icon: 'maternity.svg' },
  { keywords: ['住家保姆', '保姆', '家政'], icon: 'home-care.svg' },
  { keywords: ['小时工', '钟点', '临时'], icon: 'hourly-clean.svg' },
  { keywords: ['老人陪护', '老人', '养老', '陪护'], icon: 'elder-care.svg' },
  { keywords: ['家庭保洁', '保洁', '清洁', '收纳'], icon: 'cleaning.svg' }
];
const HIGHLIGHT_ICON_MAP = [
  { keywords: ['范围', '区域', '覆盖', '重点'], icon: 'location.svg' },
  { keywords: ['推荐', '匹配', '顾问'], icon: 'match.svg' },
  { keywords: ['保障', '审核', '核验', '健康'], icon: 'shield.svg' }
];
const DEFAULT_PUBLIC_PROFILE = {
  companyName: '北京阳光北亚家政',
  shortName: '阳光北亚',
  defaultCity: '北京',
  companyLogo: ''
};
const DEFAULT_CUSTOMER_HERO = {
  visible: true,
  title: '找靠谱阿姨，先看档案再预约',
  subtitle: '保姆、月嫂、育儿嫂、小时工，一站式匹配',
  primaryText: '发布需求',
  primaryTargetType: 'demand',
  primaryTargetValue: '',
  secondaryText: '找阿姨',
  secondaryTargetType: 'find_ayi',
  secondaryTargetValue: ''
};
const DEFAULT_PROCESS = [
  { step: '1', title: '提交需求', desc: '填写服务类型、地址和时间' },
  { step: '2', title: '顾问匹配', desc: '根据家庭情况推荐合适阿姨' },
  { step: '3', title: '预约面试', desc: '线上提交预约，线下确认上户' }
];
const CUSTOMER_HOME_GROUPS = {
  shortcuts: 'customer_home_shortcuts',
  services: 'customer_home_services'
};
const AYI_HOME_GROUPS = {
  quick: 'ayi_home_quick',
  nav: 'ayi_home_nav'
};
const DEFAULT_AYI_TOP = {
  visible: true,
  title: '阿姨接单',
  description: '今日可申请工作'
};
const DEFAULT_AYI_PROFILE_PROMPT = {
  visible: true,
  title: '完善资料，优先推荐',
  description: '',
  profileButtonText: '资料',
  certButtonText: '证件'
};
const DEFAULT_AYI_RECOMMENDED_JOBS = {
  visible: true,
  title: '今日推荐工作',
  moreText: '查看更多',
  limit: 3
};

function normalizeServiceTheme(theme) {
  const value = String(theme || '').toLowerCase();
  if (value === 'rose' || value === 'pink') return 'pink';
  if (value === 'warm' || value === 'gold') return 'gold';
  if (['green', 'blue', 'mint'].includes(value)) return value;
  return 'default';
}

function matchIconByKeywords(text, mappings) {
  const value = String(text || '');
  const match = mappings.find((item) => item.keywords.some((keyword) => value.indexOf(keyword) >= 0));
  return match ? `${SERVICE_ICON_BASE}${match.icon}` : '';
}

function parseTargetConfig(value) {
  if (!value || typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function isGroupValue(value) {
  return Object.keys(CUSTOMER_HOME_GROUPS).some((key) => CUSTOMER_HOME_GROUPS[key] === value)
    || Object.keys(AYI_HOME_GROUPS).some((key) => AYI_HOME_GROUPS[key] === value);
}

function normalizeVisible(value) {
  return value !== false && value !== 'false' && value !== 0 && value !== '0';
}

function buildCustomerHero(module, profile) {
  const config = module ? parseTargetConfig(module.targetValue) : {};
  const hero = Object.assign({}, DEFAULT_CUSTOMER_HERO, {
    visible: module ? normalizeVisible(module.visible) : DEFAULT_CUSTOMER_HERO.visible,
    title: module && module.title ? module.title : DEFAULT_CUSTOMER_HERO.title,
    subtitle: module && module.description ? module.description : DEFAULT_CUSTOMER_HERO.subtitle,
    primaryText: config.primaryText || config.primaryButtonText || DEFAULT_CUSTOMER_HERO.primaryText,
    primaryTargetType: config.primaryTargetType || config.primaryTarget || DEFAULT_CUSTOMER_HERO.primaryTargetType,
    primaryTargetValue: config.primaryTargetValue || '',
    secondaryText: config.secondaryText || config.secondaryButtonText || DEFAULT_CUSTOMER_HERO.secondaryText,
    secondaryTargetType: config.secondaryTargetType || config.secondaryTarget || DEFAULT_CUSTOMER_HERO.secondaryTargetType,
    secondaryTargetValue: config.secondaryTargetValue || ''
  });
  return Object.assign(hero, {
    companyName: profile.companyName || profile.shortName || DEFAULT_PUBLIC_PROFILE.companyName,
    city: profile.defaultCity || DEFAULT_PUBLIC_PROFILE.defaultCity
  });
}

function getFeaturedAyis(list) {
  const source = Array.isArray(list) ? list.filter((item) => item && item.visible !== false) : [];
  const featured = source.filter((item) => item.featured === true || item.featured === 'true' || item.featuredTitle);
  const ordered = (featured.length ? featured : source)
    .slice()
    .sort((a, b) => Number(a.featuredSort || a.recommendSort || a.sort || a.id || 0)
      - Number(b.featuredSort || b.recommendSort || b.sort || b.id || 0));
  return ordered.slice(0, 4);
}

function buildAyiTop(module) {
  return Object.assign({}, DEFAULT_AYI_TOP, {
    visible: module ? normalizeVisible(module.visible) : DEFAULT_AYI_TOP.visible,
    title: module && module.title ? module.title : DEFAULT_AYI_TOP.title,
    description: module && module.description ? module.description : DEFAULT_AYI_TOP.description
  });
}

function buildAyiProfilePrompt(module) {
  const config = module ? parseTargetConfig(module.targetValue) : {};
  return Object.assign({}, DEFAULT_AYI_PROFILE_PROMPT, {
    visible: module ? normalizeVisible(module.visible) : DEFAULT_AYI_PROFILE_PROMPT.visible,
    title: module && module.title ? module.title : DEFAULT_AYI_PROFILE_PROMPT.title,
    description: module && module.description ? module.description : DEFAULT_AYI_PROFILE_PROMPT.description,
    profileButtonText: config.profileButtonText || config.primaryText || DEFAULT_AYI_PROFILE_PROMPT.profileButtonText,
    certButtonText: config.certButtonText || config.secondaryText || DEFAULT_AYI_PROFILE_PROMPT.certButtonText
  });
}

function buildAyiRecommendedJobs(module) {
  const config = module ? parseTargetConfig(module.targetValue) : {};
  const limit = Number(config.limit || config.displayCount || module && module.iconText || DEFAULT_AYI_RECOMMENDED_JOBS.limit);
  return Object.assign({}, DEFAULT_AYI_RECOMMENDED_JOBS, {
    visible: module ? normalizeVisible(module.visible) : DEFAULT_AYI_RECOMMENDED_JOBS.visible,
    title: module && module.title ? module.title : DEFAULT_AYI_RECOMMENDED_JOBS.title,
    moreText: config.moreText || config.moreButtonText || DEFAULT_AYI_RECOMMENDED_JOBS.moreText,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 20) : DEFAULT_AYI_RECOMMENDED_JOBS.limit
  });
}

function defaultAyiQuickEntries(applications) {
  const count = Array.isArray(applications) ? applications.length : 0;
  return [
    { id: 'default-ayi-profile', title: '个人资料', description: '经验、薪资、服务类型', targetType: 'profile' },
    { id: 'default-ayi-applications', title: '我的接单', description: `${count} 条申请`, targetType: 'applications' }
  ];
}

function defaultAyiNavItems(applications) {
  const count = Array.isArray(applications) ? applications.length : 0;
  return [
    { id: 'default-ayi-work', title: '工作', targetType: 'work' },
    { id: 'default-ayi-applications-nav', title: `我的接单 ${count}`, targetType: 'applications' },
    { id: 'default-ayi-certs', title: '实名认证', targetType: 'certs' }
  ];
}

Page({
  data: {
    role: '',
    noRole: true,
    isCustomer: false,
    isAyi: false,
    profile: null,
    profileText: '请先完善个人资料和证件信息',
    applications: [],
    todayJobs: [],
    customerShortcuts: [],
    customerHero: buildCustomerHero(null, DEFAULT_PUBLIC_PROFILE),
    companyDisplayName: DEFAULT_PUBLIC_PROFILE.companyName,
    companyDefaultCity: DEFAULT_PUBLIC_PROFILE.defaultCity,
    companyLogoDisplay: '',
    ayiTop: DEFAULT_AYI_TOP,
    ayiQuickEntries: defaultAyiQuickEntries([]),
    ayiProfilePrompt: DEFAULT_AYI_PROFILE_PROMPT,
    ayiNavItems: defaultAyiNavItems([]),
    ayiRecommendedJobs: DEFAULT_AYI_RECOMMENDED_JOBS,
    ayiJobSource: [],
    serviceHighlights: [],
    serviceItems: [],
    features: [
      '身份与健康资料审核',
      '顾问协助预约面试',
      '合同与服务保障'
    ],
    process: DEFAULT_PROCESS,
    recommended: [],
    companyBanners: [],
    companyProfile: {},
    backendError: ''
  },

  bannerLoadSeq: 0,
  serviceCenterLoadSeq: 0,

  onShow() {
    const app = getApp();
    const isCustomer = app.globalData.role === 'customer';
    const isAyi = app.globalData.role === 'ayi';
    this.refreshPage({ skipCompanyBanners: isCustomer });
    if (!isCustomer && !isAyi) {
      this.refreshCompanyBanners(false);
      return;
    }
    app.loadBackendData({ force: true }).then(() => {
      this.refreshPage();
    });
  },

  refreshPage(options) {
    const app = getApp();
    const profile = app.globalData.ayiProfile;
    const backendAyis = app.globalData.ayis || [];
    const backendDemands = app.globalData.backendDemands || [];
    const localDemands = app.globalData.demands || [];
    const jobs = localDemands.length ? localDemands.concat(backendDemands) : backendDemands;
    const companyProfile = Object.assign({}, DEFAULT_PUBLIC_PROFILE, app.globalData.companyProfile || {});
    this.setData({
      role: app.globalData.role,
      noRole: !app.globalData.role,
      isCustomer: app.globalData.role === 'customer',
      isAyi: app.globalData.role === 'ayi',
      profile,
      profileText: profile ? `资料状态：${profile.status}` : '请先完善个人资料和证件信息',
      applications: app.globalData.applications,
      todayJobs: jobs.slice(0, 3),
      ayiJobSource: jobs,
      recommended: getFeaturedAyis(backendAyis),
      companyProfile,
      companyDisplayName: companyProfile.companyName || companyProfile.shortName || DEFAULT_PUBLIC_PROFILE.companyName,
      companyDefaultCity: companyProfile.defaultCity || DEFAULT_PUBLIC_PROFILE.defaultCity,
      backendError: app.globalData.backendError || ''
    });
    this.refreshCompanyLogo(companyProfile.companyLogo);
    if (app.globalData.role === 'customer') {
      this.refreshServiceCenter(app.globalData.serviceModules || []);
    } else if (app.globalData.role === 'ayi') {
      this.refreshServiceCenter([]);
      this.refreshAyiHome(app.globalData.serviceModules || []);
    } else {
      this.refreshServiceCenter([]);
      this.refreshAyiHome([]);
    }
    if (options && options.skipCompanyBanners) return;
    if (app.globalData.role === 'customer') {
      this.refreshCompanyBanners(true, app.globalData.banners || []);
    } else {
      this.refreshCompanyBanners(false, []);
    }
  },

  refreshCompanyLogo(imageUrl) {
    const app = getApp();
    if (!imageUrl) {
      this.setData({ companyLogoDisplay: '' });
      return;
    }
    app.resolveImageForDisplay(imageUrl, { storeId: 'company-logo' })
      .then((displayImage) => {
        this.setData({ companyLogoDisplay: displayImage || '' });
      })
      .catch(() => {
        this.setData({ companyLogoDisplay: '' });
      });
  },

  refreshCompanyBanners(shouldShow, sourceBanners) {
    const seq = this.bannerLoadSeq + 1;
    this.bannerLoadSeq = seq;
    const app = getApp();
    const bannersSource = Array.isArray(sourceBanners) ? sourceBanners : [];

    console.log('[home-banner] role=', app.globalData.role);
    console.log('[home-banner] sourceCount=', bannersSource.length);

    if (!shouldShow) {
      console.log('[home-banner] validCount=', 0);
      console.log('[home-banner] displayedCount=', 0);
      this.setData({ companyBanners: [] });
      return;
    }

    const validBanners = bannersSource
      .filter((item) => item && item.visible !== false && item.image)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));

    console.log('[home-banner] validCount=', validBanners.length);

    if (!validBanners.length) {
      console.log('[home-banner] displayedCount=', 0);
      this.setData({ companyBanners: [] });
      return;
    }

    Promise.all(validBanners.map((item) => app.resolveImageForDisplay(item.image, { storeId: `banner-${item.id}` })
      .then((displayImage) => Object.assign({}, item, {
        displayImage,
        imageMode: this.getCompanyBannerImageMode(item)
      }))
      .catch(() => Object.assign({}, item, { displayImage: '', imageMode: this.getCompanyBannerImageMode(item) }))))
      .then((list) => {
        if (seq !== this.bannerLoadSeq) return;
        const companyBanners = list.filter((item) => item.displayImage);
        console.log('[home-banner] displayedCount=', companyBanners.length);
        this.setData({
          companyBanners
        });
      });
  },

  getCompanyBannerImageMode(item) {
    const text = `${item.title || ''} ${item.subtitle || ''}`;
    return /证书|资质|荣誉|获奖/.test(text) ? 'aspectFit' : 'aspectFill';
  },

  refreshServiceCenter(sourceModules) {
    const seq = this.serviceCenterLoadSeq + 1;
    this.serviceCenterLoadSeq = seq;
    const app = getApp();
    const modules = Array.isArray(sourceModules) ? sourceModules : [];
    const sortedModules = modules
      .filter((item) => item)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
    const customerHeroSource = sortedModules.find((item) => item.moduleType === 'highlight'
      && item.targetType === 'customer_home_hero');
    const visibleModules = sortedModules.filter((item) => item.visible !== false);

    const prepare = (item) => app.resolveImageForDisplay(item.iconImage, { storeId: `service-${item.id}` })
      .then((displayIcon) => Object.assign({}, item, {
        displayIcon: displayIcon || this.getDefaultServiceIcon(item),
        theme: normalizeServiceTheme(item.theme)
      }))
      .catch(() => Object.assign({}, item, {
        displayIcon: this.getDefaultServiceIcon(item),
        theme: normalizeServiceTheme(item.theme)
      }));

    Promise.all(visibleModules.map(prepare)).then((items) => {
      if (seq !== this.serviceCenterLoadSeq) return;
      const companyProfile = Object.assign({}, DEFAULT_PUBLIC_PROFILE, getApp().globalData.companyProfile || {});
      const overviewItems = items.filter((item) => item.moduleType === 'highlight'
        && item.targetType === 'customer_home_overview');
      const flowItems = items.filter((item) => item.moduleType === 'highlight'
        && item.targetType === 'customer_home_flow')
        .map((item, index) => ({
          step: item.iconText || String(index + 1),
          title: item.title,
          desc: item.description
        }));
      const groupedShortcuts = items.filter((item) => item.moduleType === 'shortcut'
        && item.targetValue === CUSTOMER_HOME_GROUPS.shortcuts);
      const legacyShortcuts = items.filter((item) => item.moduleType === 'shortcut'
        && item.targetValue !== CUSTOMER_HOME_GROUPS.shortcuts);
      const customerShortcuts = groupedShortcuts.length ? groupedShortcuts : legacyShortcuts;
      const groupedServices = items.filter((item) => item.moduleType === 'service'
        && item.targetValue === CUSTOMER_HOME_GROUPS.services);
      const legacyServices = items.filter((item) => item.moduleType === 'service');
      this.setData({
        customerHero: buildCustomerHero(customerHeroSource, companyProfile),
        serviceHighlights: overviewItems,
        serviceItems: groupedServices.length ? groupedServices : legacyServices,
        customerShortcuts,
        process: flowItems.length ? flowItems : DEFAULT_PROCESS
      });
    });
  },

  refreshAyiHome(sourceModules) {
    const modules = Array.isArray(sourceModules) ? sourceModules : [];
    const sortedModules = modules
      .filter((item) => item)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
    const visibleModules = sortedModules.filter((item) => item.visible !== false);
    const topModule = sortedModules.find((item) => item.moduleType === 'highlight'
      && item.targetType === 'ayi_home_top');
    const promptModule = sortedModules.find((item) => item.moduleType === 'highlight'
      && item.targetType === 'ayi_home_profile_prompt');
    const jobsModule = sortedModules.find((item) => item.moduleType === 'highlight'
      && item.targetType === 'ayi_home_recommended_jobs');
    const quickEntries = visibleModules.filter((item) => item.moduleType === 'shortcut'
      && item.targetValue === AYI_HOME_GROUPS.quick);
    const navItems = visibleModules.filter((item) => item.moduleType === 'shortcut'
      && item.targetValue === AYI_HOME_GROUPS.nav);
    const jobConfig = buildAyiRecommendedJobs(jobsModule);
    this.setData({
      ayiTop: buildAyiTop(topModule),
      ayiQuickEntries: quickEntries.length ? quickEntries : defaultAyiQuickEntries(this.data.applications),
      ayiProfilePrompt: buildAyiProfilePrompt(promptModule),
      ayiNavItems: navItems.length ? navItems : defaultAyiNavItems(this.data.applications),
      ayiRecommendedJobs: jobConfig,
      todayJobs: (this.data.ayiJobSource || []).slice(0, jobConfig.limit)
    });
  },

  getDefaultServiceIcon(item) {
    const text = `${item.title || ''} ${item.description || ''} ${item.targetValue || ''}`;
    if (item.moduleType === 'highlight') {
      return matchIconByKeywords(text, HIGHLIGHT_ICON_MAP) || `${SERVICE_ICON_BASE}shield.svg`;
    }
    if (item.moduleType === 'shortcut') {
      return matchIconByKeywords(text, SERVICE_ICON_MAP.concat(HIGHLIGHT_ICON_MAP)) || `${SERVICE_ICON_BASE}service-default.svg`;
    }
    return matchIconByKeywords(text, SERVICE_ICON_MAP) || `${SERVICE_ICON_BASE}service-default.svg`;
  },

  handleServiceIconError(event) {
    const id = String(event.currentTarget.dataset.id || '');
    const updateIcon = (item) => (String(item.id) === id
      ? Object.assign({}, item, { displayIcon: this.getDefaultServiceIcon(item) })
      : item);
    this.setData({
      serviceHighlights: this.data.serviceHighlights.map(updateIcon),
      serviceItems: this.data.serviceItems.map(updateIcon),
      customerShortcuts: this.data.customerShortcuts.map(updateIcon)
    });
  },

  chooseCustomer() {
    getApp().setRole('customer');
    this.onShow();
  },

  chooseAyi() {
    getApp().setRole('ayi');
    this.onShow();
  },

  goList(event) {
    const type = event.currentTarget.dataset.type || '';
    getApp().globalData.pendingServiceType = type;
    wx.switchTab({
      url: '/pages/service/service'
    });
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/ayi-detail/ayi-detail?id=${event.currentTarget.dataset.id}`
    });
  },

  goDemand() {
    wx.navigateTo({
      url: '/pages/demand/demand'
    });
  },

  goAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  navigateByTarget(targetType, targetValue) {
    const type = String(targetType || 'none').toLowerCase();
    const value = isGroupValue(targetValue) ? '' : (targetValue || '');
    if (['find_ayi', 'service', 'services', '找阿姨', '服务'].includes(type)) {
      const serviceType = value === 'all' ? '' : value;
      this.goList({ currentTarget: { dataset: { type: serviceType } } });
      return true;
    }
    if (['demand', 'demands', '发布需求'].includes(type)) {
      this.goDemand();
      return true;
    }
    if (['customer_service', '客服咨询'].includes(type)) {
      this.callService();
      return true;
    }
    if (['about', 'company', '公司介绍'].includes(type)) {
      this.goAbout();
      return true;
    }
    if (['store', 'stores', '门店'].includes(type)) {
      wx.switchTab({
        url: '/pages/stores/stores'
      });
      return true;
    }
    return false;
  },

  handleCustomerHeroTap(event) {
    const dataset = event.currentTarget.dataset || {};
    this.navigateByTarget(dataset.targetType, dataset.targetValue);
  },

  handleServiceCenterTap(event) {
    const item = event.currentTarget.dataset.item || {};
    this.navigateByTarget(item.targetType || 'service', item.targetValue || item.title || '');
  },

  handleShortcutTap(event) {
    const item = event.currentTarget.dataset.item || {};
    this.navigateByTarget(item.targetType, item.targetValue || item.title || '');
  },

  handleCompanyBannerTap(event) {
    const banner = this.data.companyBanners[Number(event.currentTarget.dataset.index)];
    if (banner) this.navigateByTarget(banner.targetType || 'none', banner.targetValue || '');
  },

  handleCompanyBannerImageError(event) {
    const id = event.currentTarget.dataset.id;
    console.warn(`[home-banner] image load failed id=${id || '-'}`);
    this.setData({
      companyBanners: this.data.companyBanners.filter((item) => String(item.id) !== String(id))
    });
  },

  navigateAyiTarget(targetType, targetValue) {
    const type = String(targetType || targetValue || 'none').toLowerCase();
    if (['profile', 'ayi_profile', '个人资料', '资料'].includes(type)) {
      this.goProfile();
      return true;
    }
    if (['certs', 'certificates', 'ayi_certs', '实名认证', '证件'].includes(type)) {
      this.goCerts();
      return true;
    }
    if (['applications', 'my_applications', 'orders', '我的接单', '我的申请'].includes(type)) {
      this.goApplications();
      return true;
    }
    if (['work', 'jobs', 'hall', 'service', '工作', '找工作'].includes(type)) {
      this.goHall({ currentTarget: { dataset: { type: isGroupValue(targetValue) ? '' : targetValue || '' } } });
      return true;
    }
    if (['customer_service', '客服咨询', '联系客服'].includes(type)) {
      this.callService();
      return true;
    }
    return false;
  },

  handleAyiShortcutTap(event) {
    const item = event.currentTarget.dataset.item || {};
    this.navigateAyiTarget(item.targetType, item.targetValue || item.title || '');
  },

  handleAyiNavTap(event) {
    const item = event.currentTarget.dataset.item || {};
    this.navigateAyiTarget(item.targetType, item.targetValue || item.title || '');
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

  goHall(event) {
    const type = event && event.currentTarget ? event.currentTarget.dataset.type || '' : '';
    getApp().globalData.pendingServiceType = type;
    wx.switchTab({
      url: '/pages/service/service'
    });
  },

  goApplications() {
    wx.navigateTo({
      url: '/pages/my-applications/my-applications'
    });
  },

  callService() {
    const phoneNumber = (getApp().globalData.companyProfile || {}).customerServicePhone;
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
    this.refreshPage();
  }
});
