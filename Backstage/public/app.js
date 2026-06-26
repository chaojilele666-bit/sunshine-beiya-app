const resources = {
  dashboard: {
    title: '管理看板',
    desc: '管理端查看点击量、客户信息量、阿姨信息量、发布量和业务状态汇总。',
    custom: 'dashboard'
  },
  accounts: {
    title: '账号权限',
    desc: '规划后台正式登录入口，并按运营端、管理端分组管理真实账号。',
    fields: [
      ['name', '姓名/账号名称'],
      ['phone', '手机号/登录账号'],
      ['role', '账号角色', 'select', ['运营端', '管理端']],
      ['entry', '进入端口', 'select', ['微信小程序', '后台管理']],
      ['permissions', '权限说明，逗号分隔'],
      ['status', '状态', 'select', ['启用', '停用']],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${displayRoleName(item.role)} / ${item.entry || '-'}`,
      `权限：${Array.isArray(item.permissions) ? item.permissions.join('、') : item.permissions || '-'}`,
      `状态：${item.status || '-'}`
    ]
  },
  companyProfile: {
    title: '公司基础信息',
    desc: '统一维护小程序展示的公司名称、简介、客服电话、地址和营业时间。',
    custom: 'companyProfile',
    fields: [
      ['companyName', '公司名称'],
      ['shortName', '公司简称'],
      ['introduction', '公司简介', 'textarea'],
      ['customerServicePhone', '客服电话'],
      ['address', '公司地址', 'textarea'],
      ['businessHours', '营业时间']
    ]
  },
  banners: {
    title: '首页轮播',
    desc: '维护小程序首页顶部展示图、活动图和推荐入口。',
    fields: [
      ['title', '标题'],
      ['subtitle', '副标题'],
      ['image', '展示图片', 'image'],
      ['targetType', '跳转类型', 'select', ['无跳转', '找阿姨', '发布需求', '门店', '公司介绍']],
      ['sort', '排序', 'number'],
      ['visible', '是否显示', 'boolean']
    ],
    summary: (item) => [
      item.subtitle || '-',
      `跳转：${item.targetType || '无跳转'}`,
      `排序：${item.sort || 0}`
    ]
  },
  ayis: {
    title: '阿姨管理',
    desc: '维护阿姨资料、服务类型、薪资和审核状态。',
    fields: [
      ['image', '阿姨照片', 'image'],
      ['name', '姓名'],
      ['phone', '手机号'],
      ['source', '来源', 'select', ['小程序', '电话', '微信', '门店', '后台录入']],
      ['age', '年龄', 'number'],
      ['hometown', '籍贯'],
      ['serviceType', '服务类型', 'select', ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护']],
      ['experience', '工作年限', 'number'],
      ['liveType', '是否住家', 'select', ['住家', '不住家', '可协商']],
      ['salary', '期望薪资'],
      ['availableTime', '可上户时间'],
      ['skills', '技能标签，逗号分隔'],
      ['storeId', '所属门店ID', 'number'],
      ['featured', '是否金牌推荐', 'boolean'],
      ['featuredTitle', '推荐称号'],
      ['status', '状态', 'select', ['待审核', '已认证', '已下架']],
      ['visible', '是否在小程序展示', 'visibility'],
      ['idCardImage', '身份证照片', 'image'],
      ['healthCertImage', '健康证照片', 'image'],
      ['skillCertImage', '技能证书照片', 'image'],
      ['intro', '自我介绍', 'textarea']
    ],
    summary: (item) => [
      `${item.serviceType || '-'} / ${item.age || '-'}岁 / ${item.experience || '-'}年经验`,
      `${item.hometown || '-'} / ${item.salary || '-'}`,
      `状态：${item.status || '-'}`
    ]
  },
  demands: {
    title: '客户需求',
    desc: '客户发布需求后，后台跟进匹配、面试和成交状态。',
    fields: [
      ['customerName', '客户姓名'],
      ['phone', '手机号'],
      ['source', '来源', 'select', ['小程序', '电话', '微信', '门店', '后台录入']],
      ['serviceType', '服务类型', 'select', ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护']],
      ['city', '城市'],
      ['address', '地址'],
      ['startTime', '上户时间'],
      ['budget', '预算'],
      ['familyInfo', '家庭情况', 'textarea'],
      ['consultant', '跟进顾问'],
      ['followNote', '跟进备注', 'textarea'],
      ['status', '状态', 'select', ['待处理', '已联系', '匹配中', '已匹配', '已关闭']]
    ],
    summary: (item) => [
      `${item.serviceType || '-'} / ${item.budget || '-'}`,
      `${item.city || ''} ${item.address || ''}`,
      `状态：${item.status || '-'}`
    ]
  },
  appointments: {
    title: '预约面试',
    desc: '客户预约某位阿姨后，后台安排面试和跟进结果。',
    fields: [
      ['customerName', '客户姓名'],
      ['phone', '手机号'],
      ['ayiName', '预约阿姨'],
      ['serviceType', '服务类型', 'select', ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护']],
      ['date', '面试时间'],
      ['address', '面试地址'],
      ['consultant', '跟进顾问'],
      ['status', '状态', 'select', ['待联系', '已确认', '已面试', '已取消', '已成交']],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${item.ayiName || '-'} / ${item.serviceType || '-'}`,
      `${item.date || '-'} / ${item.address || '-'}`,
      `状态：${item.status || '-'}`
    ]
  },
  applications: {
    title: '接单申请',
    desc: '阿姨看到客户需求后申请接单，后台审核和安排沟通。',
    fields: [
      ['ayiName', '阿姨姓名'],
      ['ayiPhone', '阿姨手机号'],
      ['demandId', '客户需求ID', 'number'],
      ['serviceType', '服务类型', 'select', ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护']],
      ['customerAddress', '客户地址'],
      ['startTime', '上户时间'],
      ['budget', '预算'],
      ['consultant', '跟进顾问'],
      ['status', '状态', 'select', ['已申请', '已联系', '已推荐', '已拒绝', '已成交']],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${item.ayiName || '-'} 申请 ${item.serviceType || '-'}`,
      `${item.customerAddress || '-'} / ${item.budget || '-'}`,
      `状态：${item.status || '-'}`
    ]
  },
  orders: {
    title: '订单跟进',
    desc: '客户和阿姨确认后形成订单，后台维护成交、合同、服务状态。',
    fields: [
      ['orderNo', '订单编号'],
      ['customerName', '客户姓名'],
      ['customerPhone', '客户手机号'],
      ['ayiName', '阿姨姓名'],
      ['ayiPhone', '阿姨手机号'],
      ['serviceType', '服务类型', 'select', ['育儿嫂', '月嫂', '住家保姆', '小时工', '老人陪护']],
      ['address', '服务地址'],
      ['startTime', '上户时间'],
      ['price', '成交价格'],
      ['consultant', '跟进顾问'],
      ['contractStatus', '合同状态', 'select', ['未签约', '已签约', '已作废']],
      ['payStatus', '付款状态', 'select', ['未付款', '已付定金', '已结清', '已退款']],
      ['status', '服务状态', 'select', ['待上户', '服务中', '已完成', '已取消']],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${item.customerName || '-'} / ${item.ayiName || '-'}`,
      `${item.serviceType || '-'} / ${item.price || '-'}`,
      `状态：${item.status || '-'} / ${item.payStatus || '-'}`
    ]
  },
  orderDispatches: {
    title: '人工派单',
    desc: '记录订单人工派单和更换阿姨过程，供管理端查看最近操作。',
    fields: [
      ['orderId', '订单ID', 'number'],
      ['orderNo', '订单编号'],
      ['ayiName', '阿姨姓名'],
      ['ayiPhone', '阿姨手机号'],
      ['dispatchType', '派单类型', 'select', ['人工派单', '更换阿姨']],
      ['status', '状态', 'select', ['已派单', '已接受', '已拒绝', '已取消']],
      ['assignedBy', '派单人'],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${item.orderNo || item.orderId || '-'} / ${item.ayiName || '-'}`,
      `${item.dispatchType || '-'} / ${item.assignedBy || '-'}`,
      `状态：${item.status || '-'} / ${item.visible === false ? '小程序下架' : '小程序上架'}`
    ]
  },
  stores: {
    title: '门店信息',
    desc: '维护门店名称、地址、电话、覆盖范围和是否显示。',
    fields: [
      ['image', '门店图片', 'image'],
      ['name', '门店名称'],
      ['district', '区域', 'select', ['东城区', '朝阳区', '海淀区', '丰台区', '通州区', '西城区']],
      ['address', '地址'],
      ['phone', '电话'],
      ['area', '覆盖范围'],
      ['tags', '服务标签，逗号分隔'],
      ['canStay', '可住宿', 'boolean'],
      ['visible', '是否显示', 'boolean'],
      ['intro', '门店简介', 'textarea'],
      ['businessHours', '营业时间'],
      ['managerName', '店长姓名'],
      ['managerTitle', '店长职位'],
      ['managerImage', '店长照片', 'image'],
      ['managerIntro', '店长简介', 'textarea'],
      ['staffCount', '员工人数', 'number'],
      ['consultantCount', '顾问人数', 'number'],
      ['ayiCount', '阿姨储备数量', 'number'],
      ['teamIntro', '团队简介', 'textarea'],
      ['latitude', '纬度', 'number'],
      ['longitude', '经度', 'number']
    ],
    summary: (item) => [
      `${item.district || '-'} / ${item.phone || '-'}`,
      item.address || '-',
      `覆盖：${item.area || '-'}`
    ]
  },
  serviceModules: {
    title: '服务中心',
    desc: '维护客户端首页“服务中心”的服务说明和具体家政服务入口。',
    fields: [
      ['title', '显示名称'],
      ['summary', '说明文字', 'textarea'],
      ['moduleType', '项目类型', 'select', ['highlight', 'service', 'shortcut']],
      ['iconText', '文字图标'],
      ['iconImage', '贴图地址', 'image'],
      ['theme', '视觉主题', 'select', ['green', 'mint', 'rose', 'blue', 'warm']],
      ['targetType', '点击行为', 'select', ['none', 'find_ayi', 'demand', 'customer_service', 'about', 'service', 'store', '无跳转', '找阿姨', '发布需求', '门店', '公司介绍']],
      ['targetValue', '点击参数'],
      ['image', '展示图片', 'image'],
      ['sort', '排序', 'number'],
      ['visible', '是否显示', 'boolean']
    ],
    summary: (item) => [
      `${displayModuleType(item.moduleType || 'highlight')} / ${item.iconText || '-'}`,
      item.summary || '-',
      `点击：${item.targetType || '无跳转'}`,
      `排序：${item.sort || 0}`,
      `显示：${String(item.visible)}`
    ]
  }
};

let currentResource = 'accounts';
let currentRoute = 'home';
let currentRecord = null;
let cache = [];
let pendingImages = {};
let currentUser = null;
let authToken = null;
let allowedResources = [];
let expandedAccountRole = null;

const roleDisplayMap = {
  管理端: '管理端',
  运营端: '运营端',
  boss: '管理端',
  operator: '运营端'
};

roleDisplayMap[`老${'板'}端`] = '管理端';

const rolePersistMap = {
  管理端: '管理端',
  运营端: '运营端'
};

const routeToResourceMap = {
  dashboard: 'dashboard',
  accounts: 'accounts',
  company: 'companyProfile',
  ayis: 'ayis',
  demands: 'demands',
  appointments: 'appointments',
  applications: 'applications',
  orders: 'orders',
  dispatches: 'orderDispatches',
  stores: 'stores',
  services: 'serviceModules',
  banners: 'banners'
};

const resourceToRouteMap = Object.entries(routeToResourceMap).reduce((result, [route, resource]) => {
  result[resource] = route;
  return result;
}, {});

function displayRoleName(role) {
  return roleDisplayMap[role] || role || '-';
}

function normalizeRoleForSave(role) {
  return rolePersistMap[role] || role;
}

const list = document.querySelector('#list');
const form = document.querySelector('#form');
const editor = document.querySelector('.editor');
const layout = document.querySelector('.layout');
const sectionTitle = document.querySelector('#sectionTitle');
const sectionDesc = document.querySelector('#sectionDesc');
const formTitle = document.querySelector('#formTitle');
const loginForm = document.querySelector('#loginForm');
const loginTip = document.querySelector('#loginTip');
const currentUserLabel = document.querySelector('#currentUser');
const backHomeBtn = document.querySelector('#backHomeBtn');

const roleAccess = {
  boss: ['dashboard', 'accounts', 'companyProfile', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'orderDispatches', 'stores', 'serviceModules', 'banners'],
  operator: ['ayis', 'demands', 'appointments', 'applications', 'orders', 'orderDispatches', 'stores', 'serviceModules', 'banners']
};

const accountGroups = [
  {
    role: '运营端',
    title: '后台运营端账号',
    entry: '后台管理',
    desc: '员工进入后台，维护阿姨、客户需求、面试、接单、门店和公司内容。'
  },
  {
    role: '管理端',
    title: '管理端账号',
    entry: '后台管理',
    desc: '管理端进入后台，查看全部数据、管理看板、订单和账号权限。'
  }
];

const imageTips = {
  image: '建议上传清晰正面照片，后续用于小程序阿姨列表和详情页展示。',
  idCardImage: '用于后台身份核验，正式版会上传到云存储并限制权限查看。',
  healthCertImage: '用于健康证审核，正式版会记录有效期和审核状态。',
  skillCertImage: '可上传月嫂证、育婴师证、护工证等技能证书。',
  managerImage: '用于门店详情页店长卡片展示，当前本地 MVP 可保存为 base64 图片。',
  default: '建议上传横图，后续小程序可用于卡片展示。'
};

function normalizeValue(key, value) {
  if (['skills', 'tags', 'permissions'].includes(key)) {
    return String(value || '').split(',').map((text) => text.trim()).filter(Boolean);
  }
  if (['canStay', 'visible', 'featured'].includes(key)) {
    return value === true || value === 'true';
  }
  if (['age', 'experience', 'sort', 'demandId', 'orderId', 'storeId', 'staffCount', 'consultantCount', 'ayiCount', 'latitude', 'longitude'].includes(key)) {
    return Number(value) || 0;
  }
  return value;
}

function displayModuleType(value) {
  const map = {
    highlight: '服务说明',
    service: '家政服务',
    shortcut: '首页快捷入口'
  };
  return map[value] || value || '服务说明';
}

function displaySelectOption(key, option) {
  if (key === 'moduleType') return displayModuleType(option);
  const targetMap = {
    none: '无跳转',
    find_ayi: '找阿姨',
    demand: '发布需求',
    customer_service: '客服咨询',
    about: '公司介绍',
    service: '服务页',
    store: '门店'
  };
  if (key === 'targetType') return targetMap[option] || option;
  return option;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getStatusClass(status) {
  if (['已认证', '已匹配', '客户已确认', '已面试', '已成交', '启用', true].includes(status)) return 'ok';
  if (['已下架', '已关闭', '已失效', '客户已拒绝', '已取消', '停用', false].includes(status)) return 'off';
  return '';
}

async function api(path, options) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(`/api/${path}`, {
    headers,
    ...options
  });
  if (!response.ok) {
    if (response.status === 401 && path !== 'auth/login') {
      clearAuth('登录已过期，请重新登录。');
    }
    throw new Error(await response.text());
  }
  return response.status === 204 ? null : response.json();
}

function clearAuth(message = '') {
  currentUser = null;
  authToken = null;
  allowedResources = [];
  localStorage.removeItem('ygby_auth_token');
  document.body.classList.remove('is-authed');
  loginTip.textContent = message;
}

function getAllowedResources() {
  if (allowedResources.length) return allowedResources.filter((item) => resources[item]);
  if (!currentUser) return [];
  return roleAccess[currentUser.role] || [];
}

function getRouteFromHash() {
  return (location.hash || '#/home').replace(/^#\/?/, '') || 'home';
}

function setRoute(route) {
  const next = `#/${route || 'home'}`;
  if (location.hash === next) {
    renderRoute();
    return;
  }
  location.hash = next;
}

function markActiveRoute(route) {
  document.body.classList.toggle('route-home', route === 'home');
  document.body.classList.toggle('route-module', route !== 'home');
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.route === route);
  });
}

function applyAuthShell() {
  if (!currentUser || !roleAccess[currentUser.role]) {
    document.body.classList.remove('is-authed');
    return;
  }

  document.body.classList.add('is-authed');
  currentUserLabel.textContent = `${currentUser.username || currentUser.phone} / ${displayRoleName(currentUser.role)}`;
  const allowed = getAllowedResources();
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.hidden = tab.dataset.route !== 'home' && !allowed.includes(tab.dataset.resource);
  });
}

async function loadResource(resource = currentResource) {
  const allowed = getAllowedResources();
  if (currentUser && allowed.length && !allowed.includes(resource)) {
    renderHome();
    return;
  }
  currentResource = resource;
  currentRoute = resourceToRouteMap[resource] || resource;
  currentRecord = null;
  const meta = resources[resource];
  sectionTitle.textContent = meta.title;
  sectionDesc.textContent = meta.desc;
  formTitle.textContent = `新增${meta.title}`;
  document.querySelector('#addBtn').hidden = Boolean(meta.custom);
  closeEditor();
  markActiveRoute(currentRoute);
  if (meta.custom === 'dashboard') {
    const dashboard = await api('dashboard');
    renderDashboard(dashboard);
    form.innerHTML = '<p class="muted">管理看板为管理端查看页，不需要在右侧编辑。</p>';
    formTitle.textContent = '看板说明';
    return;
  }
  if (meta.custom === 'companyProfile') {
    const profile = await api('company-profile');
    cache = profile ? [profile] : [];
    renderCompanyProfile(profile || {});
    renderCompanyProfileForm(profile || {});
    editor.classList.add('is-open');
    layout.classList.add('editor-open');
    return;
  }
  cache = await api(resource);
  renderList();
}

function renderHome() {
  currentRoute = 'home';
  currentRecord = null;
  cache = [];
  closeEditor();
  markActiveRoute('home');
  sectionTitle.textContent = '后台功能首页';
  sectionDesc.textContent = '选择一个功能模块进入独立页面视图。首页只展示入口，不加载业务列表。';
  document.querySelector('#addBtn').hidden = true;
  formTitle.textContent = '页面说明';
  form.innerHTML = '<p class="muted">点击左侧导航或下方入口卡片进入对应模块。进入模块后，只显示当前模块内容。</p>';

  const cards = getAllowedResources().map((resource) => {
    const meta = resources[resource];
    const route = resourceToRouteMap[resource] || resource;
    return `
      <button class="module-card" data-action="route-card" data-route="${escapeHtml(route)}">
        <span>${escapeHtml(meta.title)}</span>
        <small>${escapeHtml(meta.desc)}</small>
      </button>
    `;
  }).join('');

  list.innerHTML = `
    <div class="home-grid">
      ${cards || '<p class="muted">当前账号暂无可进入的后台模块。</p>'}
    </div>
  `;
}

async function renderRoute() {
  if (!currentUser || !roleAccess[currentUser.role]) return;
  const route = getRouteFromHash();
  if (route === 'home') {
    renderHome();
    return;
  }
  const resource = routeToResourceMap[route];
  if (!resource) {
    setRoute('home');
    return;
  }
  const allowed = getAllowedResources();
  if (!allowed.includes(resource)) {
    setRoute('home');
    return;
  }
  await loadResource(resource);
}

function openEditor(record = null) {
  renderForm(record);
  editor.classList.add('is-open');
  layout.classList.add('editor-open');
  editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeEditor() {
  currentRecord = null;
  pendingImages = {};
  form.dataset.mode = '';
  form.dataset.demandId = '';
  editor.classList.remove('is-open');
  layout.classList.remove('editor-open');
  formTitle.textContent = '新增/编辑';
  form.innerHTML = '';
}

function renderDashboard(data) {
  const cards = (data.cards || []).map((card) => `
    <article class="metric-card">
      <div class="metric-label">${escapeHtml(card.label)}</div>
      <div class="metric-value">${escapeHtml(card.value)}</div>
      <div class="metric-note">${escapeHtml(card.note || '')}</div>
    </article>
  `).join('');
  const tables = (data.tables || []).map((table) => `
    <section class="dashboard-table">
      <h3>${escapeHtml(table.title)}</h3>
      ${(table.rows || []).map((row) => `
        <div class="dashboard-row">
          <span>${escapeHtml(row.name)}</span>
          <strong>${escapeHtml(row.value)}</strong>
        </div>
      `).join('') || '<p class="muted">暂无数据</p>'}
    </section>
  `).join('');

  list.innerHTML = `
    <div class="metric-grid">${cards}</div>
    <div class="dashboard-grid">${tables}</div>
  `;
}

function renderCompanyProfile(profile) {
  list.innerHTML = `
    <article class="record">
      <div>
        <div class="record-title">${escapeHtml(profile.companyName || '未填写公司名称')}</div>
        <div class="record-line">简称：${escapeHtml(profile.shortName || '-')}</div>
        <div class="record-line">客服电话：${escapeHtml(profile.customerServicePhone || '未配置')}</div>
        <div class="record-line">地址：${escapeHtml(profile.address || '-')}</div>
        <div class="record-line">营业时间：${escapeHtml(profile.businessHours || '-')}</div>
        <div class="record-line">${escapeHtml(profile.introduction || '')}</div>
      </div>
    </article>
    <p class="muted">公司基础信息为单条配置。管理端可在右侧表单中直接修改并保存，运营端无权访问。</p>
  `;
}

function renderCompanyProfileForm(profile) {
  currentRecord = profile;
  pendingImages = {};
  form.dataset.mode = 'company-profile';
  formTitle.textContent = '编辑公司基础信息';
  form.innerHTML = resources.companyProfile.fields.map(([key, label, type = 'text']) => {
    const value = profile[key] || '';
    if (type === 'textarea') {
      return `<div class="field"><label>${label}</label><textarea name="${key}">${escapeHtml(value)}</textarea></div>`;
    }
    return `<div class="field"><label>${label}</label><input type="${type}" name="${key}" value="${escapeHtml(value)}" /></div>`;
  }).join('') + `
    <div class="form-actions">
      <button type="submit">保存修改</button>
      <button type="button" class="secondary" id="company-profile-reset">取消修改</button>
    </div>
  `;
}

function isEntrancePlanAccount(item) {
  return ['客户入口', '阿姨入口'].includes(item.name);
}

function renderPermissionTags(permissions) {
  const list = Array.isArray(permissions)
    ? permissions
    : String(permissions || '').split(',').map((text) => text.trim()).filter(Boolean);

  return list.length
    ? list.map((item) => `<span class="permission-tag">${escapeHtml(item)}</span>`).join('')
    : '<span class="permission-tag empty">未填写权限</span>';
}

function renderAccountRow(item) {
  const title = item.name || `未命名${item.role || '账号'} #${item.id}`;
  const status = item.status || '启用';
  const roleText = displayRoleName(item.role);

  return `
    <article class="account-row">
      <div>
        <div class="record-title">${escapeHtml(title)}</div>
        <div class="record-line">登录账号：${escapeHtml(item.phone || '未填写')} / ${escapeHtml(roleText)} / ${escapeHtml(item.entry || '-')}</div>
        <div class="permission-list">${renderPermissionTags(item.permissions)}</div>
        ${item.note ? `<div class="record-line">${escapeHtml(item.note)}</div>` : ''}
        <div class="status-badge ${getStatusClass(status)}">${escapeHtml(status)}</div>
      </div>
      <div class="record-actions">
        <button data-action="edit" data-id="${item.id}">编辑</button>
        <button class="delete" data-action="delete" data-id="${item.id}">删除</button>
      </div>
    </article>
  `;
}

function renderAccountsList() {
  const planHtml = accountGroups.map((group) => `
    <article class="account-plan-card">
      <div class="login-role">${escapeHtml(group.role)}</div>
      <div class="record-title">${escapeHtml(group.entry)}</div>
      <div class="record-line">${escapeHtml(group.desc)}</div>
    </article>
  `).join('');

  const realAccounts = cache.filter((item) => !isEntrancePlanAccount(item));
  const groupsHtml = accountGroups.map((group) => {
    const rows = realAccounts.filter((item) => displayRoleName(item.role) === group.role);
    const isExpanded = expandedAccountRole === group.role;
    return `
      <section class="account-group ${isExpanded ? 'is-expanded' : ''}">
        <button class="account-group-toggle" data-action="toggle-account-group" data-role="${escapeHtml(group.role)}">
          <div>
            <h3>${escapeHtml(group.title)}</h3>
            <p>${escapeHtml(group.desc)}</p>
          </div>
          <span>
            <strong>${rows.length} 个</strong>
            <em>${isExpanded ? '收起' : '展开'}</em>
          </span>
        </button>
        ${isExpanded ? (rows.map(renderAccountRow).join('') || '<p class="muted">暂无账号，点击右上角“新增”创建。</p>') : ''}
      </section>
    `;
  }).join('');

  list.innerHTML = `
    <div class="account-note">
      新增账号会按照“账号角色”自动归到下面对应分组。后台登录身份只展示运营端和管理端。
    </div>
    <div class="account-plan-grid">${planHtml}</div>
    <div class="account-groups">${groupsHtml}</div>
  `;
}

function renderList() {
  if (currentResource === 'accounts') {
    renderAccountsList();
    return;
  }

  const meta = resources[currentResource];
  list.innerHTML = cache.map((item) => {
    const title = item.name || item.customerName || item.title || `记录 ${item.id}`;
    const lines = meta.summary(item).map((text) => `<div class="record-line">${escapeHtml(text)}</div>`).join('');
    const status = item.status || (Object.prototype.hasOwnProperty.call(item, 'visible') ? (item.visible ? '显示中' : '已隐藏') : '');
    const badge = status ? `<div class="status-badge ${getStatusClass(item.status ?? item.visible)}">${escapeHtml(status)}</div>` : '';
    const needsThumb = ['ayis', 'serviceModules'].includes(currentResource);
    const image = item.image
      ? `<img class="record-thumb" src="${escapeHtml(item.image)}" alt="${escapeHtml(title)}" />`
      : needsThumb
        ? '<div class="record-thumb placeholder">无图</div>'
        : '';
    const isEditing = currentRecord && currentRecord.id === item.id;
    const editLabel = currentResource === 'ayis' ? '编辑资料' : '编辑';
    const demandMatchButton = currentResource === 'demands'
      ? `<button data-action="match-demand" data-id="${item.id}">推荐阿姨</button>`
      : '';
    return `
      <article class="record ${needsThumb ? 'has-thumb' : ''} ${isEditing ? 'is-editing' : ''}">
        ${image}
        <div>
          <div class="record-title">${escapeHtml(title)}</div>
          ${lines}
          ${badge}
        </div>
        <div class="record-actions">
          ${demandMatchButton}
          <button data-action="edit" data-id="${item.id}">${editLabel}</button>
          <button class="delete" data-action="delete" data-id="${item.id}">删除</button>
        </div>
      </article>
    `;
  }).join('') || '<p class="muted">暂无数据，点击新增开始录入。</p>';
}

function isCertifiedAyi(item) {
  return ['已认证', 'approved'].includes(item.status) && item.visible !== false;
}

async function openDemandMatchPanel(record) {
  currentRecord = record;
  form.dataset.mode = 'demand-match';
  form.dataset.demandId = record.id;
  editor.classList.add('is-open');
  layout.classList.add('editor-open');
  formTitle.textContent = `推荐阿姨：${record.customerName || record.name || `需求 ${record.id}`}`;

  const [matchResult, ayis] = await Promise.all([
    api(`demands/${record.id}/matches`),
    api('ayis')
  ]);
  const certifiedAyis = (ayis || []).filter(isCertifiedAyi);
  const options = certifiedAyis.map((ayi) => (
    `<option value="${ayi.id}">${escapeHtml(ayi.name || `阿姨 ${ayi.id}`)} / ${escapeHtml(ayi.serviceType || '-')} / ${escapeHtml(ayi.phone || '-')}</option>`
  )).join('');
  const matchRows = (matchResult.matches || []).map((match) => `
    <div class="match-row">
      <div>
        <strong>${escapeHtml(match.ayiName || `阿姨 ${match.ayiId}`)}</strong>
        <span>${escapeHtml(match.serviceType || '-')}</span>
        <span class="status-badge ${getStatusClass(match.status)}">${escapeHtml(match.status)}</span>
        ${match.recommendNote ? `<div class="record-line">${escapeHtml(match.recommendNote)}</div>` : ''}
      </div>
      ${match.status === '已推荐' ? `<button type="button" class="secondary" data-action="expire-match" data-id="${match.id}">标记失效</button>` : ''}
    </div>
  `).join('') || '<p class="muted">暂未推荐阿姨。</p>';

  form.innerHTML = `
    <section class="match-panel">
      <div class="record-title">${escapeHtml(record.customerName || '-')} / ${escapeHtml(record.serviceType || '-')}</div>
      <div class="record-line">电话：${escapeHtml(record.phone || '-')}</div>
      <div class="record-line">地址：${escapeHtml(`${record.city || ''} ${record.address || ''}`.trim() || '-')}</div>
      <div class="record-line">预算：${escapeHtml(record.budget || '-')} / 上户：${escapeHtml(record.startTime || '-')}</div>
      <div class="record-line">状态：${escapeHtml(record.status || '-')}</div>
      <h3>已推荐阿姨</h3>
      <div class="match-list">${matchRows}</div>
      <h3>新增推荐</h3>
      <div class="field">
        <label>选择已认证阿姨</label>
        <select name="ayiId">${options}</select>
      </div>
      <div class="field">
        <label>推荐说明</label>
        <textarea name="recommendNote" placeholder="说明推荐原因、匹配点和注意事项"></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" ${options ? '' : 'disabled'}>保存推荐</button>
        <button type="button" class="secondary" id="clearBtn">关闭</button>
      </div>
    </section>
  `;
}

function renderForm(record = null) {
  currentRecord = record;
  pendingImages = {};
  const meta = resources[currentResource];
  const recordName = record ? (record.name || record.customerName || record.title || `记录 ${record.id}`) : '';
  formTitle.textContent = record ? `编辑${meta.title}：${recordName}` : `新增${meta.title}`;
  const fields = meta.fields.map(([key, label, type = 'text', options = []]) => {
    const raw = record ? (key === 'role' ? displayRoleName(record[key]) : record[key]) : '';
    const value = Array.isArray(raw) ? raw.join(', ') : raw || '';
    if (type === 'textarea') {
      return `<div class="field"><label>${label}</label><textarea name="${key}">${escapeHtml(value)}</textarea></div>`;
    }
    if (type === 'select') {
      const optionHtml = options.map((option) => (
        `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(displaySelectOption(key, option))}</option>`
      )).join('');
      return `<div class="field"><label>${label}</label><select name="${key}">${optionHtml}</select></div>`;
    }
    if (type === 'boolean') {
      return `
        <div class="field">
          <label>${label}</label>
          <select name="${key}">
            <option value="true" ${value === true || value === 'true' || value === '' ? 'selected' : ''}>是</option>
            <option value="false" ${value === false || value === 'false' ? 'selected' : ''}>否</option>
          </select>
        </div>
      `;
    }
    if (type === 'visibility') {
      return `
        <div class="field">
          <label>${label}</label>
          <select name="${key}">
            <option value="true" ${value === true || value === 'true' || value === '' ? 'selected' : ''}>上架</option>
            <option value="false" ${value === false || value === 'false' ? 'selected' : ''}>下架</option>
          </select>
        </div>
      `;
    }
    if (type === 'image') {
      const preview = value ? `<img class="image-preview" src="${escapeHtml(value)}" alt="图片预览" />` : '<div class="image-empty">暂未上传图片</div>';
      return `
        <div class="field image-field">
          <label>${label}</label>
          <div class="image-preview-wrap" data-preview="${key}">${preview}</div>
          <input type="hidden" name="${key}" value="${escapeHtml(value)}" />
          <input type="file" accept="image/*" data-image-field="${key}" />
          <div class="field-help">${imageTips[key] || imageTips.default}</div>
        </div>
      `;
    }
    return `<div class="field"><label>${label}</label><input type="${type}" name="${key}" value="${escapeHtml(value)}" /></div>`;
  }).join('');

  form.innerHTML = `
    ${record ? `<div class="edit-state">正在编辑：${escapeHtml(recordName)}。修改后点下面的“保存修改”。</div>` : ''}
    ${fields}
    <div class="form-actions">
      <button type="submit">${record ? '保存修改' : '保存新增'}</button>
      <button type="button" class="secondary" id="clearBtn">关闭</button>
    </div>
  `;
}

document.querySelector('.tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('.tab');
  if (tab) setRoute(tab.dataset.route || 'home');
});

document.querySelector('#refreshBtn').addEventListener('click', () => renderRoute());
document.querySelector('#addBtn').addEventListener('click', () => openEditor());
backHomeBtn.addEventListener('click', () => setRoute('home'));
document.querySelector('#logoutBtn').addEventListener('click', async () => {
  try {
    await api('auth/logout', { method: 'POST' });
  } catch (error) {
    // Local logout should still clear the browser state if the session already expired.
  }
  clearAuth('已退出，请重新登录。');
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  loginTip.textContent = '';
  try {
    const result = await api('auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: formData.get('identifier'),
        password: formData.get('password')
      })
    });
    authToken = result.token;
    currentUser = result.user;
    localStorage.setItem('ygby_auth_token', authToken);
    const me = await api('auth/me');
    currentUser = me.user;
    allowedResources = me.allowedResources || [];
    if (!me.canUseBackstage) {
      clearAuth('该账号不能进入后台，请使用运营端或管理端账号。');
      return;
    }
    loginForm.reset();
    applyAuthShell();
    setRoute('home');
  } catch (error) {
    loginTip.textContent = '登录失败，请检查账号、密码或账号状态。';
  }
});

list.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.action === 'route-card') {
    setRoute(button.dataset.route || 'home');
    return;
  }
  if (button.dataset.action === 'toggle-account-group') {
    expandedAccountRole = expandedAccountRole === button.dataset.role ? null : button.dataset.role;
    renderAccountsList();
    return;
  }
  const id = Number(button.dataset.id);
  if (button.dataset.action === 'edit') {
    const record = cache.find((item) => item.id === id);
    if (!record) {
      alert('没有找到这条数据，请刷新后再试。');
      return;
    }
    openEditor(record);
    renderList();
    return;
  }
  if (button.dataset.action === 'match-demand') {
    const record = cache.find((item) => item.id === id);
    if (!record) {
      alert('没有找到这条需求，请刷新后再试。');
      return;
    }
    try {
      await openDemandMatchPanel(record);
    } catch (error) {
      alert(error.message || '加载推荐信息失败');
    }
    return;
  }
  if (button.dataset.action === 'delete' && confirm('确定删除这条数据？')) {
    const target = cache.find((item) => item.id === id);
    if (currentResource === 'accounts') {
      if (currentUser && target && target.id === currentUser.id) {
        alert('不能删除当前正在登录的账号。你可以先新建另一个管理端账号，再切换过去处理。');
        return;
      }
      if (target && displayRoleName(target.role) === '管理端') {
        const managementAccounts = cache.filter((item) => displayRoleName(item.role) === '管理端' && item.status !== '停用');
        if (managementAccounts.length <= 1) {
          alert('至少保留一个管理端账号，否则后台会进不去。');
          return;
        }
      }
    }

    try {
      await api(`${currentResource}/${id}`, { method: 'DELETE' });
      await loadResource();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  }
});

form.addEventListener('click', (event) => {
  if (event.target.id === 'company-profile-reset') {
    renderCompanyProfileForm(currentRecord || {});
    return;
  }
  if (event.target.id === 'clearBtn') closeEditor();
  const expireButton = event.target.closest('[data-action="expire-match"]');
  if (expireButton) {
    event.preventDefault();
    if (!confirm('确定将这条推荐标记为已失效？')) return;
    api(`demandMatches/${expireButton.dataset.id}/expire`, { method: 'POST' })
      .then(() => openDemandMatchPanel(currentRecord))
      .catch((error) => alert(error.message || '标记失效失败'));
  }
});

form.addEventListener('change', (event) => {
  const input = event.target.closest('[data-image-field]');
  if (!input || !input.files || !input.files[0]) return;

  const key = input.dataset.imageField;
  const reader = new FileReader();
  reader.onload = () => {
    pendingImages[key] = reader.result;
    const hidden = form.querySelector(`input[type="hidden"][name="${key}"]`);
    const preview = form.querySelector(`[data-preview="${key}"]`);
    if (hidden) hidden.value = reader.result;
    if (preview) {
      preview.innerHTML = `<img class="image-preview" src="${reader.result}" alt="图片预览" />`;
    }
  };
  reader.readAsDataURL(input.files[0]);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (form.dataset.mode === 'company-profile') {
    const formData = new FormData(form);
    const payload = {};
    resources.companyProfile.fields.forEach(([key]) => {
      payload[key] = formData.get(key);
    });
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = '保存中...';
    }
    try {
      const profile = await api('company-profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      alert('公司基础信息已保存。');
      renderCompanyProfile(profile);
      renderCompanyProfileForm(profile);
    } catch (error) {
      alert(error.message || '保存公司基础信息失败');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = '保存修改';
      }
    }
    return;
  }
  if (form.dataset.mode === 'demand-match') {
    const formData = new FormData(form);
    try {
      await api(`demands/${form.dataset.demandId}/matches`, {
        method: 'POST',
        body: JSON.stringify({
          ayiId: Number(formData.get('ayiId')),
          recommendNote: formData.get('recommendNote')
        })
      });
      alert('已保存推荐。');
      const demandId = Number(form.dataset.demandId);
      await loadResource('demands');
      const record = cache.find((item) => item.id === demandId);
      if (record) await openDemandMatchPanel(record);
    } catch (error) {
      alert(error.message || '保存推荐失败');
    }
    return;
  }
  const formData = new FormData(form);
  const payload = {};
  resources[currentResource].fields.forEach(([key]) => {
    payload[key] = normalizeValue(key, pendingImages[key] || formData.get(key));
  });
  if (currentResource === 'accounts' && payload.role) {
    payload.role = normalizeRoleForSave(payload.role);
  }

  if (currentRecord) {
    await api(`${currentResource}/${currentRecord.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    alert('已保存修改。');
  } else {
    await api(currentResource, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    alert('已保存新增。');
  }
  await loadResource();
});

async function boot() {
  authToken = localStorage.getItem('ygby_auth_token');
  if (!authToken) {
    clearAuth('');
    return;
  }
  try {
    const me = await api('auth/me');
    currentUser = me.user;
    allowedResources = me.allowedResources || [];
    if (!me.canUseBackstage) {
      clearAuth('该账号不能进入后台，请使用运营端或管理端账号。');
      return;
    }
    applyAuthShell();
    if (!location.hash || location.hash === '#') {
      setRoute('home');
    } else {
      await renderRoute();
    }
  } catch (error) {
    clearAuth('登录已过期，请重新登录。');
  }
}

window.addEventListener('hashchange', () => {
  renderRoute().catch((error) => {
    alert(error.message || '页面加载失败');
  });
});

boot();
