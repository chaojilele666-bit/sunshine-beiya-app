const CATEGORY_OPTIONS = [
  { key: '', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'demand', label: '客户需求' },
  { key: 'interview', label: '面试' },
  { key: 'application', label: '接单申请' },
  { key: 'review', label: '资料审核' }
];

const ALLOWED_PAGES = [
  '/pages/demand-detail/demand-detail',
  '/pages/my-applications/my-applications',
  '/pages/service/service',
  '/pages/ayi-profile/ayi-profile',
  '/pages/ayi-certs/ayi-certs',
  '/pages/mine/mine',
  '/pages/messages/messages'
];

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function typeLabel(type) {
  const value = String(type || '');
  if (value.indexOf('interview') >= 0) return '面试';
  if (value.indexOf('application') >= 0) return '接单申请';
  if (value.indexOf('review') >= 0) return '资料审核';
  if (value.indexOf('demand') >= 0) return '客户需求';
  return '业务提醒';
}

Page({
  data: {
    categories: CATEGORY_OPTIONS,
    activeCategory: '',
    messages: [],
    total: 0,
    loading: false,
    empty: true,
    needLogin: false,
    loadError: ''
  },

  onShow() {
    const app = getApp();
    if (!app.isLoggedIn()) {
      this.setData({
        needLogin: true,
        loading: false,
        empty: true,
        messages: [],
        total: 0
      });
      app.updateUnreadBadge(0);
      return;
    }
    this.setData({ needLogin: false });
    this.loadMessages();
  },

  loadMessages() {
    const app = getApp();
    const active = this.data.activeCategory;
    const filters = { page: 1, pageSize: 50 };
    if (active === 'unread') {
      filters.unread = 'true';
    } else if (active) {
      filters.messageType = active;
    }
    this.setData({ loading: true, loadError: '' });
    app.fetchNotifications(filters)
      .then((result) => {
        const messages = (result.items || []).map((item) => Object.assign({}, item, {
          typeLabel: typeLabel(item.messageType),
          timeText: formatTime(item.createdAt || item.scheduledAt)
        }));
        this.setData({
          messages,
          total: Number(result.total || messages.length),
          empty: messages.length === 0,
          loading: false,
          loadError: ''
        });
        app.fetchUnreadCount();
      })
      .catch(() => {
        this.setData({
          messages: [],
          total: 0,
          empty: false,
          loading: false,
          loadError: '服务暂时不可用，请稍后重试'
        });
        wx.showToast({ title: '消息加载失败，请稍后重试', icon: 'none' });
      });
  },

  switchCategory(event) {
    this.setData({ activeCategory: event.currentTarget.dataset.key || '' });
    this.loadMessages();
  },

  markAllRead() {
    getApp().markAllNotificationsRead()
      .then(() => {
        wx.showToast({ title: '已全部标记为已读', icon: 'none' });
        this.loadMessages();
      })
      .catch(() => {
        wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
      });
  },

  openMessage(event) {
    const id = event.currentTarget.dataset.id;
    const message = this.data.messages.find((item) => String(item.id) === String(id));
    if (!message) return;
    getApp().markNotificationRead(message.id)
      .then(() => {
        this.navigateMessage(message);
        this.loadMessages();
      })
      .catch(() => {
        wx.showToast({ title: '消息状态更新失败', icon: 'none' });
      });
  },

  navigateMessage(message) {
    const path = ALLOWED_PAGES.includes(message.pagePath) ? message.pagePath : '/pages/messages/messages';
    if (path === '/pages/messages/messages') return;
    const params = message.pageParams || {};
    const query = Object.keys(params)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = `${path}${query ? `?${query}` : ''}`;
    if (['/pages/service/service', '/pages/mine/mine'].includes(path)) {
      wx.switchTab({ url: path });
      return;
    }
    wx.navigateTo({
      url,
      fail: () => {
        wx.showToast({ title: '暂时无法打开相关记录', icon: 'none' });
      }
    });
  },

  goLogin() {
    getApp().redirectToLogin('/pages/messages/messages');
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/home' });
  }
});
