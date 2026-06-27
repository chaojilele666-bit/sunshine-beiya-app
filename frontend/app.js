const { ayis: localAyis } = require('./data/ayis');
const { sampleDemands } = require('./data/demands');
const { stores: localStores } = require('./data/stores');

const BACKEND_BASE_URL = 'http://localhost:5177';
const CUSTOMER_DEMAND_ACCESS_KEY = 'customerDemandAccessList';
const imageDisplayCache = {};
const DEFAULT_COMPANY_PROFILE = {
  companyName: '',
  shortName: '',
  companyLogo: '',
  defaultCity: '',
  introduction: '',
  customerServicePhone: '',
  address: '',
  businessHours: ''
};

function hashString(value) {
  let hash = 0;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function imageExtensionFromUrl(url) {
  const cleanUrl = String(url || '').split('?')[0].split('#')[0].toLowerCase();
  const match = cleanUrl.match(/\.([a-z0-9]+)$/);
  if (!match) return 'png';
  if (['jpg', 'jpeg', 'png'].includes(match[1])) return match[1];
  return 'png';
}

function imageSourceType(url) {
  const value = String(url || '');
  if (!value) return 'empty';
  if (value.indexOf('http://localhost:5177/') === 0 || value.indexOf('http://127.0.0.1:5177/') === 0) return 'http-local';
  if (value.indexOf('https://') === 0) return 'https';
  if (value.indexOf('wxfile://') === 0 || value.indexOf('file://') === 0 || value.indexOf('http://tmp/') === 0 || value.charAt(0) === '/') return 'local-file';
  return 'other';
}

function imageInfo(src) {
  const value = String(src || '');
  return {
    imageType: value.startsWith('data:image/') ? 'data-url' : (value ? 'url' : 'empty'),
    imageLength: value.length
  };
}

function normalizeDemandStatus(status) {
  const map = {
    顾问待联系: '待处理',
    待跟进: '待处理',
    待匹配: '匹配中',
    已推荐: '匹配中',
    已面试: '已匹配',
    已成交: '已匹配',
    已取消: '已关闭'
  };
  return map[status] || status || '待处理';
}

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
    status: normalizeDemandStatus(item.status),
    createdAt: item.createdAt || item.source || '后台数据'
  });
}

function normalizeStore(item, index) {
  const colors = ['#d9f1e9', '#f8e7d6', '#e7edff', '#e9f5df', '#e8f0f3'];
  return Object.assign({}, item, {
    id: item.id,
    color: item.color || colors[index % colors.length],
    tags: Array.isArray(item.tags) ? item.tags : [],
    canStay: Boolean(item.canStay),
    imageLoadFailed: false
  }, imageInfo(item.image));
}

function logStoreSource(source, stores) {
  console.info(`[stores] source=${source}`);
  console.info(`[stores] count=${stores.length}`);
  stores.forEach((store) => {
    console.info(`[stores] storeId=${store.id} imageType=${store.imageType} imageLength=${store.imageLength}`);
  });
}

function resolveImageForDisplay(imageUrl, options) {
  const storeId = options && options.storeId ? options.storeId : '-';
  const sourceType = imageSourceType(imageUrl);
  const urlLength = String(imageUrl || '').length;

  if (!imageUrl) return Promise.resolve('');
  if (sourceType === 'https' || sourceType === 'local-file') return Promise.resolve(imageUrl);
  if (sourceType !== 'http-local') return Promise.resolve(imageUrl);
  if (imageDisplayCache[imageUrl]) return Promise.resolve(imageDisplayCache[imageUrl]);

  return new Promise((resolve) => {
    wx.request({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      success: (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300 || !res.data) {
          console.warn(`[store-image] storeId=${storeId} source=${sourceType} urlLength=${urlLength} status=request-failed statusCode=${res.statusCode}`);
          resolve('');
          return;
        }

        const extension = imageExtensionFromUrl(imageUrl);
        const filePath = `${wx.env.USER_DATA_PATH}/store-image-${hashString(imageUrl)}.${extension}`;
        wx.getFileSystemManager().writeFile({
          filePath,
          data: res.data,
          success: () => {
            imageDisplayCache[imageUrl] = filePath;
            console.info(`[store-image] storeId=${storeId} source=${sourceType} urlLength=${urlLength} status=resolved written=true`);
            resolve(filePath);
          },
          fail: (error) => {
            console.warn(`[store-image] storeId=${storeId} source=${sourceType} urlLength=${urlLength} status=write-failed error=${error && error.errMsg ? error.errMsg : 'unknown'}`);
            resolve('');
          }
        });
      },
      fail: (error) => {
        console.warn(`[store-image] storeId=${storeId} source=${sourceType} urlLength=${urlLength} status=request-failed error=${error && error.errMsg ? error.errMsg : 'unknown'}`);
        resolve('');
      }
    });
  });
}

function normalizeServiceModules(modules) {
  if (!modules || !modules.length) {
    return [];
  }
  return modules.map((item) => ({
    id: item.id,
    title: item.title || item.label || '',
    description: item.summary || item.description || item.value || '',
    label: item.title,
    value: item.summary,
    image: item.image,
    moduleType: item.moduleType || item.module_type || 'highlight',
    iconText: item.iconText || item.icon_text || (item.title || '').slice(0, 1),
    iconImage: item.iconImage || item.icon_image || '',
    theme: item.theme || 'green',
    targetType: item.targetType || item.target_type || '无跳转',
    targetValue: item.targetValue || item.target_value || '',
    sort: Number(item.sort || 0),
    visible: item.visible !== false
  }));
}

function normalizeCompanyProfile(profile) {
  const source = profile || {};
  return {
    companyName: source.companyName || source.company_name || '',
    shortName: source.shortName || source.short_name || '',
    companyLogo: source.companyLogo || source.company_logo || '',
    defaultCity: source.defaultCity || source.default_city || '',
    introduction: source.introduction || '',
    customerServicePhone: source.customerServicePhone || source.customer_service_phone || '',
    address: source.address || '',
    businessHours: source.businessHours || source.business_hours || ''
  };
}

function showBackendSyncFailedToast() {
  wx.showToast({
    title: '已保存到本地，后台同步失败，请确认后台是否启动',
    icon: 'none',
    duration: 3000
  });
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
    backendSource: '',
    serviceModules: [],
    banners: [],
    companyProfile: Object.assign({}, DEFAULT_COMPANY_PROFILE),
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

  requestBackend(path, method, data, headers) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${BACKEND_BASE_URL}/api/${path}`,
        method: method || 'GET',
        data: data || {},
        header: Object.assign({
          'content-type': 'application/json'
        }, headers || {}),
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

  getStoredCustomerDemandAccessList() {
    const list = wx.getStorageSync(CUSTOMER_DEMAND_ACCESS_KEY);
    return Array.isArray(list) ? list.filter((item) => item && item.demandId && item.accessToken) : [];
  },

  saveCustomerDemandAccess(demandId, accessToken) {
    if (!demandId || !accessToken) return;
    const list = this.getStoredCustomerDemandAccessList();
    const next = [
      { demandId, accessToken, savedAt: new Date().toISOString() },
      ...list.filter((item) => String(item.demandId) !== String(demandId))
    ];
    wx.setStorageSync(CUSTOMER_DEMAND_ACCESS_KEY, next.slice(0, 50));
  },

  findCustomerDemandAccess(demandId) {
    return this.getStoredCustomerDemandAccessList().find((item) => String(item.demandId) === String(demandId));
  },

  fetchCustomerDemand(demandId, accessToken) {
    const token = accessToken || (this.findCustomerDemandAccess(demandId) || {}).accessToken;
    if (!token) return Promise.reject(new Error('缺少需求访问凭证'));
    return this.requestBackend(`miniprogram/demands/${demandId}`, 'GET', {}, {
      'X-Demand-Access-Token': token
    })
      .then((data) => normalizeDemand(data.demand));
  },

  fetchCustomerDemandMatches(demandId, accessToken) {
    const token = accessToken || (this.findCustomerDemandAccess(demandId) || {}).accessToken;
    if (!token) return Promise.reject(new Error('缺少需求访问凭证'));
    return this.requestBackend(`miniprogram/demands/${demandId}/matches`, 'GET', {}, {
      'X-Demand-Access-Token': token
    })
      .then((data) => data.matches || []);
  },

  decideDemandMatch(matchId, demandId, decision, accessToken) {
    const token = accessToken || (this.findCustomerDemandAccess(demandId) || {}).accessToken;
    if (!token) return Promise.reject(new Error('缺少需求访问凭证'));
    return this.requestBackend(`miniprogram/demand-matches/${matchId}/decision`, 'POST', {
      demandId,
      decision
    }, {
      'X-Demand-Access-Token': token
    });
  },

  resolveImageForDisplay,

  getServiceModulesByType(moduleType) {
    return (this.globalData.serviceModules || [])
      .filter((item) => item && item.visible !== false && item.moduleType === moduleType)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },

  getServiceTypeNames(currentValue) {
    const names = this.getServiceModulesByType('service')
      .map((item) => item.title || item.targetValue || item.label)
      .filter(Boolean);
    if (currentValue && !names.includes(currentValue)) {
      names.unshift(currentValue);
    }
    return names;
  },

  loadBackendData(options) {
    const path = options && options.force
      ? `miniprogram?_=${Date.now()}`
      : 'miniprogram';
    return this.requestBackend(path)
      .then((data) => {
        const backendAyis = (data.ayis || []).map(normalizeAyi);
        const backendDemands = (data.demands || []).map(normalizeDemand);
        const backendStores = (data.stores || []).map(normalizeStore);
        this.globalData.backendReady = true;
        this.globalData.backendSource = data.source || 'unknown';
        this.globalData.backendAyis = backendAyis;
        this.globalData.backendDemands = backendDemands;
        this.globalData.backendStores = backendStores;
        this.globalData.ayis = backendAyis.length ? backendAyis : localAyis;
        this.globalData.serviceModules = normalizeServiceModules(data.serviceModules);
        this.globalData.banners = data.banners || [];
        this.globalData.companyProfile = normalizeCompanyProfile(data.companyProfile);
        logStoreSource(this.globalData.backendSource, backendStores);
        return data;
      })
      .catch((error) => {
        this.globalData.backendReady = false;
        this.globalData.backendSource = 'local-fallback';
        this.globalData.ayis = localAyis;
        this.globalData.backendDemands = sampleDemands;
        this.globalData.backendStores = localStores.map(normalizeStore);
        this.globalData.serviceModules = normalizeServiceModules([]);
        this.globalData.companyProfile = normalizeCompanyProfile(null);
        console.warn(`[stores] source=local-fallback error=${error && error.message ? error.message : 'unknown'}`);
        logStoreSource('local-fallback', this.globalData.backendStores);
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
    this.requestBackend('appointments', 'POST', record).catch(showBackendSyncFailedToast);
  },

  addDemand(demand) {
    const record = Object.assign({
      id: Date.now(),
      status: '待处理',
      createdAt: new Date().toLocaleString()
    }, demand);
    this.globalData.demands = [record, ...this.globalData.demands];
    return this.requestBackend('miniprogram/demands', 'POST', Object.assign({
      consultant: '',
      followNote: ''
    }, record)).then((result) => {
      const saved = normalizeDemand(result.demand || record);
      this.saveCustomerDemandAccess(result.demandId || saved.id, result.accessToken);
      this.globalData.demands = [saved, ...this.globalData.demands.filter((item) => item.id !== record.id)];
      return {
        demand: saved,
        demandId: result.demandId || saved.id,
        accessToken: result.accessToken
      };
    }).catch((error) => {
      this.globalData.demands = this.globalData.demands.filter((item) => item.id !== record.id);
      throw error;
    });
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
    }, this.globalData.ayiProfile)).catch(showBackendSyncFailedToast);
  },

  addApplication(application) {
    const record = Object.assign({
      id: Date.now(),
      status: '已申请',
      createdAt: new Date().toLocaleString()
    }, application);
    this.globalData.applications = [record, ...this.globalData.applications];
    this.requestBackend('applications', 'POST', record).catch(showBackendSyncFailedToast);
  }
});
