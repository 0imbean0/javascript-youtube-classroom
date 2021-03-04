import { $ } from './utils/dom.js';
import {
  setRecentChip,
  getRecentKeywords,
  setSavedVideoId,
  getSavedVideoIds,
} from './utils/localStorage.js';
import { searchRequest, videoRequest } from '../js/request.js';
import NavigationView from './views/NavigationView.js';
import SearchModalView from './views/SearchModalView.js';
import SavedVideosView from './views/SavedVideosView.js';
import Video from '../js/models/Video.js';

export default class YoutubeController {
  constructor() {
    this.videos = [];
    this.nextPageToken;
    this.selectedTab = $('#saved-btn');
    this.navigationView = new NavigationView($('#nav-bar'));
    this.searchModalView = new SearchModalView($('.modal'));
    this.savedVideosView = new SavedVideosView($('#main-videos'));
  }

  init() {
    this.bindEvents();
    this.loadSavedVideos();
  }

  bindEvents() {
    this.navigationView.on('clickNavTab', (e) => this.changeNavTab(e.detail));
    this.searchModalView
      .on('openModal', (e) => this.searchVideo(e.detail))
      .on('submitSearch', (e) => this.searchVideo(e.detail))
      .on('scrollResult', (e) => this.searchVideo(e.detail))
      .on('clickSaveButton', (e) => this.saveVideo(e.detail))
      .on('closeModal', () => this.changeNavTab($('#saved-btn')));
  }

  changeNavTab(currentTab) {
    this.navigationView.toggleTabColor(this.selectedTab, currentTab);
    this.selectedTab = currentTab;

    if (currentTab.element.id === 'search-btn') {
      this.searchModalView.openModal();
    }
  }

  generateVideos(response) {
    const { prevPageToken, nextPageToken, items } = response;

    if (items.length === 0 && !prevPageToken) {
      this.searchModalView.showNoResult();
      return;
    }

    this.nextPageToken = nextPageToken;
    const newVideos = [
      ...items.map((item) => new Video(item.id.videoId, item.snippet)),
    ];
    this.videos = [...this.videos, ...newVideos];

    this.searchModalView.renderVideoClips(newVideos);
  }

  saveVideo(videoId) {
    const videoToSave = this.videos.find((video) => video.id === videoId);

    this.savedVideosView.addSavedVideoClip(videoToSave);
    setSavedVideoId(videoId);
  }

  searchVideo(keyword) {
    setRecentChip(keyword);
    this.searchModalView.updateChips(getRecentKeywords());
    this.searchModalView.startSearch();
    searchRequest(keyword, this.nextPageToken, this.generateVideos.bind(this));
  }

  generateSavedVideos(response) {
    const { items } = response;

    const savedVideos = [
      ...items.map((item) => new Video(item.id, item.snippet)),
    ];

    this.savedVideosView.renderSavedVideoClips(savedVideos);
  }

  loadSavedVideos() {
    const savedVideoIds = getSavedVideoIds();

    if (savedVideoIds.length === 0) return;

    videoRequest(savedVideoIds, this.generateSavedVideos.bind(this));
  }
}
