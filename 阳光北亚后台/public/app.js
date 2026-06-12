const resources = {
  dashboard: {
    title: '经营看板',
    desc: '老板端查看点击量、客户信息量、阿姨信息量、发布量和业务状态汇总。',
    custom: 'dashboard'
  },
  accounts: {
    title: '账号权限',
    desc: '规划正式登录入口，并按客户端、阿姨端、运营端、老板端分组管理真实账号。',
    fields: [
      ['name', '姓名/账号名称'],
      ['phone', '手机号/登录账号'],
      ['role', '账号角色', 'select', ['客户端', '阿姨端', '运营端', '老板端']],
      ['entry', '进入端口', 'select', ['微信小程序', '后台管理']],
      ['permissions', '权限说明，逗号分隔'],
      ['status', '状态', 'select', ['启用', '停用']],
      ['note', '备注', 'textarea']
    ],
    summary: (item) => [
      `${item.role || '-'} / ${item.entry || '-'}`,
      `权限：${Array.isArray(item.permissions) ? item.permissions.join('、') : item.permissions || '-'}`,
      `状态：${item.status || '-'}`
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
      ['status', '状态', 'select', ['待审核', '已认证', '已下架']],
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
      ['status', '状态', 'select', ['待跟进', '待匹配', '已匹配', '已面试', '已成交', '已取消']]
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
      ['visible', '是否显示', 'boolean']
    ],
    summary: (item) => [
      `${item.district || '-'} / ${item.phone || '-'}`,
      item.address || '-',
      `覆盖：${item.area || '-'}`
    ]
  },
  serviceModules: {
    title: '公司服务',
    desc: '维护客户端“公司服务”卡片，后续小程序从这里读取。',
    fields: [
      ['title', '模块标题'],
      ['summary', '模块说明', 'textarea'],
      ['image', '展示图片', 'image'],
      ['sort', '排序', 'number'],
      ['visible', '是否显示', 'boolean']
    ],
    summary: (item) => [
      item.summary || '-',
      `排序：${item.sort || 0}`,
      `显示：${String(item.visible)}`
    ]
  }
};

let currentResource = 'accounts';
let currentRecord = null;
let cache = [];
let pendingImages = {};
let currentUser = null;

const list = document.querySelector('#list');
const form = document.querySelector('#form');
const editor = document.querySelector('.editor');
const layout = document.querySelector('.layout');
const sectionTitle = document.querySelector('#sectionTitle');
const sectionDesc = document.querySelector('#sectionDesc');
const formTitle = document.querySelector('#formTitle');
const loginOptions = document.querySelector('#loginOptions');
const loginTip = document.querySelector('#loginTip');
const currentUserLabel = document.querySelector('#currentUser');

const roleAccess = {
  '老板端': ['dashboard', 'accounts', 'ayis', 'demands', 'appointments', 'applications', 'orders', 'stores', 'serviceModules', 'banners'],
  '运营端': ['ayis', 'demands', 'appointments', 'applications', 'orders', 'stores', 'serviceModules', 'banners']
};

const accountGroups = [
  {
    role: '客户端',
    title: '客户端账号',
    entry: '微信小程序',
    desc: '客户在小程序里发布需求、预约阿姨、查看自己的需求。'
  },
  {
    role: '阿姨端',
    title: '阿姨端账号',
    entry: '微信小程序',
    desc: '阿姨在小程序里完善资料、上传证件、查看工作、申请接单。'
  },
  {
    role: '运营端',
    title: '后台运营端账号',
    entry: '后台管理',
    desc: '员工进入后台，维护阿姨、客户需求、面试、接单、门店和公司内容。'
  },
  {
    role: '老板端',
    title: '老板端账号',
    entry: '后台管理',
    desc: '老板进入后台，查看全部数据、经营看板、订单和账号权限。'
  }
];

const imageTips = {
  image: '建议上传清晰正面照片，后续用于小程序阿姨列表和详情页展示。',
  idCardImage: '用于后台身份核验，正式版会上传到云存储并限制权限查看。',
  healthCertImage: '用于健康证审核，正式版会记录有效期和审核状态。',
  skillCertImage: '可上传月嫂证、育婴师证、护工证等技能证书。',
  default: '建议上传横图，后续小程序可用于卡片展示。'
};

function normalizeValue(key, value) {
  if (['skills', 'tags', 'permissions'].includes(key)) {
    return String(value || '').split(',').map((text) => text.trim()).filter(Boolean);
  }
  if (['canStay', 'visible'].includes(key)) {
    return value === true || value === 'true';
  }
  if (['age', 'experience', 'sort', 'demandId'].includes(key)) {
    return Number(value) || 0;
  }
  return value;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getStatusClass(status) {
  if (['已认证', '已匹配', '已面试', '已成交', '启用', true].includes(status)) return 'ok';
  if (['已下架', '已取消', '停用', false].includes(status)) return 'off';
  return '';
}

async function api(path, options) {
  const response = await fetch(`/api/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.status === 204 ? null : response.json();
}

async function renderLogin() {
  const accounts = await api('accounts');
  const visibleAccounts = accounts
    .filter((account) => account.status !== '停用')
    .sort((a, b) => accountGroups.findIndex((group) => group.role === a.role) - accountGroups.findIndex((group) => group.role === b.role));

  loginOptions.innerHTML = visibleAccounts.map((account) => `
    <button class="login-option" data-id="${account.id}">
      <div class="login-role">${escapeHtml(account.role)}</div>
      <div class="record-title">${escapeHtml(account.name || `未命名账号 #${account.id}`)}</div>
      <div class="login-entry">进入端口：${escapeHtml(account.entry)}</div>
      <div class="login-entry">权限：${escapeHtml((account.permissions || []).slice(0, 3).join('、'))}</div>
    </button>
  `).join('');
}

function getAllowedResources() {
  if (!currentUser) return [];
  return roleAccess[currentUser.role] || [];
}

function applyAuthShell() {
  if (!currentUser || !roleAccess[currentUser.role]) {
    document.body.classList.remove('is-authed');
    return;
  }

  document.body.classList.add('is-authed');
  currentUserLabel.textContent = `${currentUser.name} / ${currentUser.role}`;
  const allowed = getAllowedResources();
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.hidden = !allowed.includes(tab.dataset.resource);
  });
}

async function enterAs(account) {
  if (account.role === '客户端' || account.role === '阿姨端') {
    loginTip.textContent = `${account.role} 不进入后台，请打开微信小程序 demo，在首页选择“${account.role === '客户端' ? '我是客户' : '我是阿姨'}”。`;
    return;
  }

  currentUser = account;
  localStorage.setItem('ygby_current_user', JSON.stringify(account));
  applyAuthShell();
  const firstResource = getAllowedResources()[0];
  await loadResource(firstResource);
}

async function loadResource(resource = currentResource) {
  const allowed = getAllowedResources();
  if (currentUser && allowed.length && !allowed.includes(resource)) {
    resource = allowed[0];
  }
  currentResource = resource;
  currentRecord = null;
  const meta = resources[resource];
  sectionTitle.textContent = meta.title;
  sectionDesc.textContent = meta.desc;
  formTitle.textContent = `新增${meta.title}`;
  document.querySelector('#addBtn').hidden = Boolean(meta.custom);
  closeEditor();
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.resource === resource);
  });
  if (meta.custom === 'dashboard') {
    const dashboard = await api('dashboard');
    renderDashboard(dashboard);
    form.innerHTML = '<p class="muted">经营看板为老板端查看页，不需要在右侧编辑。</p>';
    formTitle.textContent = '看板说明';
    return;
  }
  cache = await api(resource);
  renderList();
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

  return `
    <article class="account-row">
      <div>
        <div class="record-title">${escapeHtml(title)}</div>
        <div class="record-line">登录账号：${escapeHtml(item.phone || '未填写')} / ${escapeHtml(item.entry || '-')}</div>
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
    const rows = realAccounts.filter((item) => item.role === group.role);
    return `
      <section class="account-group">
        <div class="account-group-head">
          <div>
            <h3>${escapeHtml(group.title)}</h3>
            <p>${escapeHtml(group.desc)}</p>
          </div>
          <strong>${rows.length} 个</strong>
        </div>
        ${rows.map(renderAccountRow).join('') || '<p class="muted">暂无账号，点击右上角“新增”创建。</p>'}
      </section>
    `;
  }).join('');

  list.innerHTML = `
    <div class="account-note">
      新增账号会按照“账号角色”自动归到下面对应分组。比如新增“运营端”，就会显示在“后台运营端账号”里。
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
    return `
      <article class="record ${needsThumb ? 'has-thumb' : ''} ${isEditing ? 'is-editing' : ''}">
        ${image}
        <div>
          <div class="record-title">${escapeHtml(title)}</div>
          ${lines}
          ${badge}
        </div>
        <div class="record-actions">
          <button data-action="edit" data-id="${item.id}">${editLabel}</button>
          <button class="delete" data-action="delete" data-id="${item.id}">删除</button>
        </div>
      </article>
    `;
  }).join('') || '<p class="muted">暂无数据，点击新增开始录入。</p>';
}

function renderForm(record = null) {
  currentRecord = record;
  pendingImages = {};
  const meta = resources[currentResource];
  const recordName = record ? (record.name || record.customerName || record.title || `记录 ${record.id}`) : '';
  formTitle.textContent = record ? `编辑${meta.title}：${recordName}` : `新增${meta.title}`;
  const fields = meta.fields.map(([key, label, type = 'text', options = []]) => {
    const raw = record ? record[key] : '';
    const value = Array.isArray(raw) ? raw.join(', ') : raw || '';
    if (type === 'textarea') {
      return `<div class="field"><label>${label}</label><textarea name="${key}">${escapeHtml(value)}</textarea></div>`;
    }
    if (type === 'select') {
      const optionHtml = options.map((option) => (
        `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(option)}</option>`
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
  if (tab) loadResource(tab.dataset.resource);
});

document.querySelector('#refreshBtn').addEventListener('click', () => loadResource());
document.querySelector('#addBtn').addEventListener('click', () => openEditor());
document.querySelector('#logoutBtn').addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('ygby_current_user');
  document.body.classList.remove('is-authed');
  loginTip.textContent = '已退出，请重新选择身份。';
});

loginOptions.addEventListener('click', async (event) => {
  const button = event.target.closest('.login-option');
  if (!button) return;
  const accounts = await api('accounts');
  const account = accounts.find((item) => item.id === Number(button.dataset.id));
  if (account) await enterAs(account);
});

list.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
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
  if (button.dataset.action === 'delete' && confirm('确定删除这条数据？')) {
    const target = cache.find((item) => item.id === id);
    if (currentResource === 'accounts') {
      if (currentUser && target && target.id === currentUser.id) {
        alert('不能删除当前正在登录的账号。你可以先新建另一个老板账号，再切换过去处理。');
        return;
      }
      if (target && target.role === '老板端') {
        const bossAccounts = cache.filter((item) => item.role === '老板端' && item.status !== '停用');
        if (bossAccounts.length <= 1) {
          alert('至少保留一个老板端账号，否则后台会进不去。');
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
  if (event.target.id === 'clearBtn') closeEditor();
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
  const formData = new FormData(form);
  const payload = {};
  resources[currentResource].fields.forEach(([key]) => {
    payload[key] = normalizeValue(key, pendingImages[key] || formData.get(key));
  });

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
  await renderLogin();
  try {
    currentUser = JSON.parse(localStorage.getItem('ygby_current_user'));
  } catch (error) {
    currentUser = null;
  }
  applyAuthShell();
  if (currentUser && roleAccess[currentUser.role]) {
    await loadResource(getAllowedResources()[0]);
  }
}

boot();
