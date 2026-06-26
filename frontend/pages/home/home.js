const { ayis } = require('../../data/ayis');
const { sampleDemands } = require('../../data/demands');

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

Page({
  data: {
    role: '',
    noRole: true,
    isCustomer: false,
    isAyi: false,
    profile: null,
    profileText: '请先完善个人资料和证件信息',
    applications: [],
    todayJobs: sampleDemands.slice(0, 3),
    customerShortcuts: [],
    serviceHighlights: [],
    serviceItems: [],
    features: [
      '身份与健康资料审核',
      '顾问协助预约面试',
      '合同与服务保障'
    ],
    process: [
      { step: '1', title: '提交需求', desc: '填写服务类型、地址和时间' },
      { step: '2', title: '顾问匹配', desc: '根据家庭情况推荐合适阿姨' },
      { step: '3', title: '预约面试', desc: '线上提交预约，线下确认上户' }
    ],
    recommended: ayis.slice(0, 4),
    companyBanners: [],
    companyProfile: {}
  },

  bannerLoadSeq: 0,
  serviceCenterLoadSeq: 0,

  onShow() {
    const app = getApp();
    const isCustomer = app.globalData.role === 'customer';
    this.refreshPage({ skipCompanyBanners: isCustomer });
    if (!isCustomer) {
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
    const backendAyis = app.globalData.ayis && app.globalData.ayis.length ? app.globalData.ayis : ayis;
    const backendDemands = app.globalData.backendDemands && app.globalData.backendDemands.length ? app.globalData.backendDemands : sampleDemands;
    const localDemands = app.globalData.demands || [];
    const jobs = localDemands.length ? localDemands.concat(backendDemands) : backendDemands;
    this.setData({
      role: app.globalData.role,
      noRole: !app.globalData.role,
      isCustomer: app.globalData.role === 'customer',
      isAyi: app.globalData.role === 'ayi',
      profile,
      profileText: profile ? `资料状态：${profile.status}` : '请先完善个人资料和证件信息',
      applications: app.globalData.applications,
      todayJobs: jobs.slice(0, 3),
      recommended: backendAyis.slice(0, 4),
      companyProfile: app.globalData.companyProfile || {}
    });
    if (app.globalData.role === 'customer') {
      this.refreshServiceCenter(app.globalData.serviceModules || []);
    } else {
      this.refreshServiceCenter([]);
    }
    if (options && options.skipCompanyBanners) return;
    if (app.globalData.role === 'customer') {
      this.refreshCompanyBanners(true, app.globalData.banners || []);
    } else {
      this.refreshCompanyBanners(false, []);
    }
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
    const visibleModules = modules
      .filter((item) => item && item.visible !== false)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));

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
      this.setData({
        serviceHighlights: items.filter((item) => item.moduleType === 'highlight'),
        serviceItems: items.filter((item) => item.moduleType === 'service'),
        customerShortcuts: items.filter((item) => item.moduleType === 'shortcut')
      });
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

  handleServiceCenterTap(event) {
    const item = event.currentTarget.dataset.item || {};
    const targetType = String(item.targetType || '无跳转').toLowerCase();
    const targetValue = item.targetValue || item.title || '';
    if (['service', 'services', '找阿姨', '服务'].includes(targetType)) {
      const type = targetValue === 'all' ? '' : targetValue;
      this.goList({ currentTarget: { dataset: { type } } });
      return;
    }
    if (['demand', 'demands', '发布需求'].includes(targetType)) {
      this.goDemand();
      return;
    }
    if (['store', 'stores', '门店'].includes(targetType)) {
      wx.switchTab({
        url: '/pages/stores/stores'
      });
      return;
    }
    if (['about', 'company', '公司介绍'].includes(targetType)) {
      this.goAbout();
    }
  },

  handleShortcutTap(event) {
    const item = event.currentTarget.dataset.item || {};
    const targetType = String(item.targetType || 'none').toLowerCase();
    const targetValue = item.targetValue || item.title || '';
    if (['find_ayi', 'service', 'services', '找阿姨'].includes(targetType)) {
      const type = targetValue === 'all' ? '' : targetValue;
      this.goList({ currentTarget: { dataset: { type } } });
      return;
    }
    if (['demand', 'demands', '发布需求'].includes(targetType)) {
      this.goDemand();
      return;
    }
    if (['customer_service', '客服咨询'].includes(targetType)) {
      this.callService();
      return;
    }
    if (['about', 'company', '公司介绍'].includes(targetType)) {
      this.goAbout();
      return;
    }
    if (['store', 'stores', '门店'].includes(targetType)) {
      wx.switchTab({
        url: '/pages/stores/stores'
      });
    }
  },

  handleCompanyBannerTap(event) {
    const banner = this.data.companyBanners[Number(event.currentTarget.dataset.index)];
    const targetType = banner ? banner.targetType || '无跳转' : '无跳转';
    if (targetType === '公司介绍') {
      this.goAbout();
      return;
    }
    if (targetType === '门店') {
      wx.switchTab({
        url: '/pages/stores/stores'
      });
      return;
    }
    if (targetType === '发布需求') {
      this.goDemand();
      return;
    }
    if (targetType === '找阿姨') {
      this.goList({ currentTarget: { dataset: {} } });
    }
  },

  handleCompanyBannerImageError(event) {
    const id = event.currentTarget.dataset.id;
    console.warn(`[home-banner] image load failed id=${id || '-'}`);
    this.setData({
      companyBanners: this.data.companyBanners.filter((item) => String(item.id) !== String(id))
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
