Page({
  data: {
    applications: [],
    noApplications: true
  },

  onShow() {
    const applications = getApp().globalData.applications || [];
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
