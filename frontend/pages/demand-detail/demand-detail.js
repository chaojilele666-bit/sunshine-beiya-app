Page({
  data: {
    demandId: '',
    accessToken: '',
    demand: null,
    matches: [],
    noMatches: true,
    loading: true,
    error: ''
  },

  onLoad(options) {
    const app = getApp();
    const demandId = options.id || options.demandId || '';
    const access = app.findCustomerDemandAccess(demandId);
    this.setData({
      demandId,
      accessToken: (access && access.accessToken) || ''
    });
  },

  onShow() {
    this.loadDemand();
  },

  loadDemand() {
    const { demandId, accessToken } = this.data;
    if (!demandId || !accessToken) {
      this.setData({
        loading: false,
        error: '没有找到这条需求的访问凭证'
      });
      return;
    }

    const app = getApp();
    this.setData({ loading: true, error: '' });
    Promise.all([
      app.fetchCustomerDemand(demandId, accessToken),
      app.fetchCustomerDemandMatches(demandId, accessToken)
    ]).then(([demand, matches]) => {
      const formattedMatches = (matches || []).map((item) => Object.assign({}, item, {
        ayi: Object.assign({}, item.ayi, {
          avatarText: ((item.ayi && item.ayi.name) || '阿姨').slice(0, 1)
        })
      }));
      this.setData({
        demand,
        matches: formattedMatches,
        noMatches: formattedMatches.length === 0,
        loading: false
      });
    }).catch(() => {
      this.setData({
        loading: false,
        error: '需求读取失败，请稍后再试'
      });
    });
  },

  goAyiDetail(event) {
    wx.navigateTo({
      url: `/pages/ayi-detail/ayi-detail?id=${event.currentTarget.dataset.id}`
    });
  },

  confirmMatch(event) {
    this.submitDecision(event.currentTarget.dataset.id, 'confirm', '确认选择这位阿姨？');
  },

  rejectMatch(event) {
    this.submitDecision(event.currentTarget.dataset.id, 'reject', '确认拒绝这位阿姨？');
  },

  submitDecision(matchId, decision, content) {
    wx.showModal({
      title: '确认操作',
      content,
      success: (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '提交中' });
        getApp().decideDemandMatch(matchId, this.data.demandId, decision, this.data.accessToken)
          .then(() => {
            wx.hideLoading();
            wx.showToast({
              title: '已更新',
              icon: 'success'
            });
            this.loadDemand();
          })
          .catch((error) => {
            wx.hideLoading();
            wx.showToast({
              title: error && error.message ? error.message : '操作失败',
              icon: 'none'
            });
          });
      }
    });
  },

  goBack() {
    wx.switchTab({
      url: '/pages/mine/mine'
    });
  }
});
