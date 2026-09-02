export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/outfits/index',
    'pages/mine/index',
    'pages/plan/index',
    'pages/outfit-detail/index',
    'pages/city-picker/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '每日穿搭',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F7F9F8'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#247C6D',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.svg',
        selectedIconPath: 'assets/tabbar/home-selected.svg'
      },
      {
        pagePath: 'pages/outfits/index',
        text: '穿搭',
        iconPath: 'assets/tabbar/outfits.svg',
        selectedIconPath: 'assets/tabbar/outfits-selected.svg'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.svg',
        selectedIconPath: 'assets/tabbar/mine-selected.svg'
      }
    ]
  }
})
