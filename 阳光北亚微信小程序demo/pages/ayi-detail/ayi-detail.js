const { ayis } = require('../../data/ayis');

Page({
  data: {
    ayi: null
  },

  onLoad(options) {
    const allAyis = getApp().globalData.ayis && getApp().globalData.ayis.length ? getApp().globalData.ayis : ayis;
    const id = options.id;
    const ayi = allAyis.find((item) => String(item.id) === String(id) || String(item._id) === String(id)) || ayis[0];
    this.setData({ ayi });
  },

  goBooking() {
    wx.navigateTo({
      url: `/pages/booking/booking?id=${this.data.ayi.id}`
    });
  }
});
