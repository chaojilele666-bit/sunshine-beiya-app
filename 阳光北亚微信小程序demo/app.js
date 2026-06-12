const { ayis: localAyis } = require('./data/ayis');
const { sampleDemands } = require('./data/demands');
const { stores: localStores } = require('./data/stores');

const BACKEND_BASE_URL = 'http://localhost:5177';

function normalizeAyi(item, index) {
  const serviceType = item.serviceType || item.role || '家政';
  const surname = (item.name || '阿姨').slice(0, 1);
  const colors = ['#d9f1e9', '#f8e7d6', '#e7edff', '#e8f0f3', '#e9f5df', '#ffe7ef'];
  return Object.assign({}, item, {
    id: item.id,
    role: serviceType,
    serviceType,
    avatarText: surname,
    avatarColor: item.avatarColor || colors[index % colors.length],
    salary: item.salary || '面议',
    rating: item.rating || 4.8,
    orders: item.orders || 0,
    skills: Array.isArray(item.skills) ? item.skills : [],
    badges: item.badges || ['后台认证', item.healthCertImage ? '健康证' : '资料审核'],
    schedule: item.availableTime || item.schedule || '可预约',
    liveType: item.liveType || '可协商',
    area: item.area || '北京',
    available: item.availableTime || '可预约',
    comment: item.intro || '后台录入阿姨资料。',
    intro: item.intro || '后台录入阿姨资料。',
    detail: item.detail || [
      `服务类型：${serviceType}`,
      `工作经验：${item.experience || '-'} 年`,
      `可上户时间：${item.availableTime || '待确认'}`
    ]
  });
}

function normalizeDemand(item) {
  return Object.assign({}, item, {
    id: item.id,
    name: item.customerName || item.name || '客户',
    serviceType: item.serviceType || '家政',
    city: item.city || '北京',
    address: item.address || item.area || '',
    startTime: item.startTime || '待确认',
    budget: item.budget || '面议',
    familyInfo: item.familyInfo || item.note || '',
    status: item.status || '待跟进',
    createdAt: item.createdAt || item.source || '后台数据'
  });
}

function normalizeStore(item, index) {
  const colors = ['#d9f1e9', '#f8e7d6', '#e7edff', '#e9f5df', '#e8f0f3'];
  return Object.assign({}, item, {
    id: item.id,
    color: item.color || colors[index % colors.length],
    tags: Array.isArray(item.tags) ? item.tags : [],
    canStay: Boolean(item.canStay)
  });
}

function normalizeServiceModules(modules) {
  if (!modules || !modules.length) {
    return [
      { label: '服务范围', value: '家政/母婴/养老' },
      { label: '重点区域', value: '东城/朝阳/海淀' },
      { label: '推荐机制', value: '顾问匹配' }
    ];
  }
  return modules.map((item) => ({
    label: item.title,
    value: item.summary,
    image: item.image
  }));
}

App({
  globalData: {
    city: '北京',
    backendBaseUrl: BACKEND_BASE_URL,
    backendReady: false,
    role: '',
    ayis: localAyis,
    backendAyis: [],
    backendDemands: [],
    backendStores: [],
    serviceModules: [],
    banners: [],
    appointments: [],
    demands: [],
    applications: [],
    ayiProfile: null,
    pendingServiceType: ''
  },

  onLaunch() {
    this.globalData.role = wx.getStorageSync('role') || '';
    this.loadBackendData();
  },

  requestBackend(path, method, data) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${BACKEND_BASE_URL}/api/${path}`,
        method: method || 'GET',
        data: data || {},
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
            return;
          }
          reject(new Error(`后台接口异常 ${res.statusCode}`));
        },
        fail: reject
      });
    });
  },

  loadBackendData() {
    return this.requestBackend('miniprogram')
      .then((data) => {
        const backendAyis = (data.ayis || []).map(normalizeAyi);
        const backendDemands = (data.demands || []).map(normalizeDemand);
        const backendStores = (data.stores || []).map(normalizeStore);
        this.globalData.backendReady = true;
        this.globalData.backendAyis = backendAyis;
        this.globalData.backendDemands = backendDemands;
        this.globalData.backendStores = backendStores;
        this.globalData.ayis = backendAyis.length ? backendAyis : localAyis;
        this.globalData.serviceModules = normalizeServiceModules(data.serviceModules);
        this.globalData.banners = data.banners || [];
        return data;
      })
      .catch(() => {
        this.globalData.backendReady = false;
        this.globalData.ayis = localAyis;
        this.globalData.backendDemands = sampleDemands;
        this.globalData.backendStores = localStores;
        this.globalData.serviceModules = normalizeServiceModules([]);
        return null;
      });
  },

  setRole(role) {
    this.globalData.role = role;
    wx.setStorageSync('role', role);
  },

  addAppointment(appointment) {
    const record = Object.assign({
      id: Date.now(),
      status: '待联系',
      createdAt: new Date().toLocaleString()
    }, appointment);
    this.globalData.appointments = [record, ...this.globalData.appointments];
    this.requestBackend('appointments', 'POST', record).catch(() => {});
  },

  addDemand(demand) {
    const record = Object.assign({
      id: Date.now(),
      status: '顾问待联系',
      createdAt: new Date().toLocaleString()
    }, demand);
    this.globalData.demands = [record, ...this.globalData.demands];
    this.requestBackend('demands', 'POST', Object.assign({
      source: '小程序',
      consultant: '',
      followNote: ''
    }, record)).catch(() => {});
  },

  saveAyiProfile(profile) {
    this.globalData.ayiProfile = Object.assign({
      status: '待审核',
      updatedAt: new Date().toLocaleString()
    }, profile);
    this.requestBackend('ayis', 'POST', Object.assign({
      image: '',
      idCardImage: '',
      healthCertImage: '',
      skillCertImage: ''
    }, this.globalData.ayiProfile)).catch(() => {});
  },

  addApplication(application) {
    const record = Object.assign({
      id: Date.now(),
      status: '已申请',
      createdAt: new Date().toLocaleString()
    }, application);
    this.globalData.applications = [record, ...this.globalData.applications];
    this.requestBackend('applications', 'POST', record).catch(() => {});
  }
});
