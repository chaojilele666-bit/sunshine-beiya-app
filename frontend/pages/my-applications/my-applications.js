Page({
  data: {
    applications: [],
    noApplications: true
  },

  onShow() {
    const app = getApp();
    if (!app.isLoggedIn()) {
      app.requireLogin().catch(() => {});
      this.setData({
        applications: [],
        noApplications: true
      });
      return;
    }
    const applications = app.globalData.applications || [];
    this.setData({
      applications,
      noApplications: applications.length === 0
    });
  },

  goHall() {
    wx.switchTab({
      url: '/pages/service/service'
    });
  }
});
