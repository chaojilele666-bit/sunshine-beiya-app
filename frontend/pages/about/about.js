const DEFAULT_COMPANY_PROFILE = {
  companyName: '北京阳光北亚家政',
  shortName: '阳光北亚',
  companyLogo: '',
  defaultCity: '北京',
  introduction: '家庭服务匹配平台，覆盖一般家政、母婴服务、育婴服务、养老护理、保洁助餐等。',
  customerServicePhone: '',
  address: '暂未配置',
  businessHours: '暂未配置'
};

const DEFAULT_INTRO_CONFIG = {
  visible: true,
  pageTitle: '公司介绍'
};

const DEFAULT_PROCESS = [
  { id: 'default-flow-1', step: '1', title: '提交服务需求', description: '' },
  { id: 'default-flow-2', step: '2', title: '顾问沟通并匹配阿姨', description: '' },
  { id: 'default-flow-3', step: '3', title: '预约面试确认细节', description: '' },
  { id: 'default-flow-4', step: '4', title: '签约上户并持续跟进', description: '' }
];

const DEFAULT_GUARANTEES = [
  { id: 'default-guarantee-1', title: '身份信息与健康资料核验', description: '' },
  { id: 'default-guarantee-2', title: '证件和技能资料可审核', description: '' },
  { id: 'default-guarantee-3', title: '顾问协助沟通服务边界', description: '' }
];

const DEFAULT_CUSTOMER_SERVICE = {
  visible: true,
  title: '客服咨询',
  description: '如果不确定适合哪类阿姨，可以先电话沟通需求。',
  buttonText: '联系客服'
};

function visible(value) {
  return value !== false && value !== 'false' && value !== 0 && value !== '0';
}

function sortedVisibleModules(modules) {
  return (modules || [])
    .filter((item) => item && visible(item.visible))
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
}

function buildIntroConfig(module) {
  return Object.assign({}, DEFAULT_INTRO_CONFIG, {
    visible: module ? visible(module.visible) : DEFAULT_INTRO_CONFIG.visible,
    pageTitle: (module && module.title) || DEFAULT_INTRO_CONFIG.pageTitle
  });
}

function buildCustomerServiceConfig(module) {
  return Object.assign({}, DEFAULT_CUSTOMER_SERVICE, {
    visible: module ? visible(module.visible) : DEFAULT_CUSTOMER_SERVICE.visible,
    title: (module && module.title) || DEFAULT_CUSTOMER_SERVICE.title,
    description: (module && module.description) || DEFAULT_CUSTOMER_SERVICE.description,
    buttonText: (module && (module.iconText || module.targetValue)) || DEFAULT_CUSTOMER_SERVICE.buttonText
  });
}

function buildStepModules(modules, fallback) {
  return modules.length ? modules.map((item, index) => ({
    id: item.id || `module-${index}`,
    step: item.iconText || String(index + 1),
    title: item.title,
    description: item.description || ''
  })) : fallback;
}

Page({
  data: {
    companyProfile: DEFAULT_COMPANY_PROFILE,
    displayLogo: '',
    introConfig: DEFAULT_INTRO_CONFIG,
    services: [],
    stores: [],
    process: [],
    guarantees: [],
    customerServiceConfig: DEFAULT_CUSTOMER_SERVICE,
    backendError: ''
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
    const profile = Object.assign({}, DEFAULT_COMPANY_PROFILE, app.globalData.companyProfile || {});
    const modules = app.globalData.serviceModules || [];
    const visibleModules = sortedVisibleModules(modules);
    const introModule = modules.find((item) => item && item.moduleType === 'highlight'
      && item.targetType === 'about_company_intro');
    const serviceModules = visibleModules.filter((item) => item.moduleType === 'service');
    const flowModules = visibleModules.filter((item) => item.moduleType === 'highlight'
      && item.targetType === 'about_service_flow');
    const guaranteeModules = visibleModules.filter((item) => item.moduleType === 'highlight'
      && item.targetType === 'about_service_guarantee');
    const customerServiceModule = modules.find((item) => item && item.moduleType === 'highlight'
      && item.targetType === 'about_customer_service');
    const sourceStores = app.globalData.backendStores || [];

    this.setData({
      companyProfile: profile,
      displayLogo: '',
      introConfig: buildIntroConfig(introModule),
      services: serviceModules.map((item) => ({
        id: item.id,
        title: item.title
      })),
      stores: sourceStores.filter((store) => store && store.visible !== false),
      process: buildStepModules(flowModules, []),
      guarantees: guaranteeModules.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || ''
      })),
      customerServiceConfig: buildCustomerServiceConfig(customerServiceModule),
      backendError: app.globalData.backendError || ''
    });
    this.refreshLogo(profile.companyLogo);
  },

  refreshLogo(imageUrl) {
    const app = getApp();
    if (!imageUrl) return;
    app.resolveImageForDisplay(imageUrl, { storeId: 'about-company-logo' })
      .then((displayLogo) => {
        this.setData({ displayLogo: displayLogo || '' });
      })
      .catch(() => {
        this.setData({ displayLogo: '' });
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
    wx.makePhoneCall({
      phoneNumber
    });
  }
});
