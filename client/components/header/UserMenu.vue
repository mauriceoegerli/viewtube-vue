<template>
  <div class="nav">
    <a
      v-show="!userAuthenticated"
      id="login"
      v-ripple
      v-tippy="'Sign in'"
      :href="`/login${currentPageRef('login')}`"
      class="tooltip nav-btn main"
      @click.prevent="onLoginClick"
      >Sign in</a
    >
    <a
      v-show="!userAuthenticated"
      id="register"
      v-ripple
      v-tippy="'Sign up'"
      :href="`/register${currentPageRef('register')}`"
      class="tooltip nav-btn"
      @click.prevent="onRegisterClick"
      >Sign up</a
    >
    <nuxt-link
      v-show="$route.name !== 'subscriptions' && userAuthenticated"
      id="subscriptions"
      v-ripple
      v-tippy="'View your subscriptions'"
      to="/subscriptions"
      class="tooltip nav-btn main"
      >Subscriptions</nuxt-link
    >
    <a
      id="account"
      v-ripple
      v-tippy="'Account'"
      :class="{ authenticated: userAuthenticated }"
      href="#"
      @click.prevent="showAccountMenu"
    >
      <div class="user-icon">
        <AccountIcon v-if="!$accessor.user.profileImage" />
        <div
          v-if="$accessor.user.profileImage"
          class="user-image"
          :style="{ 'background-image': `url(${getProfileImageUrl($accessor.user.profileImage)})` }"
        />
      </div>
      <p v-if="userAuthenticated" class="account-name">{{ $accessor.user.username }}</p>
    </a>
    <transition name="fade-up">
      <div v-if="accountMenuVisible" class="menu">
        <div v-show="userAuthenticated" class="account-menu">
          <div class="account-icon">
            <AccountIcon v-if="!$accessor.user.profileImage" />
            <div
              v-if="$accessor.user.profileImage"
              class="user-image"
              :style="{
                'background-image': `url(${getProfileImageUrl($accessor.user.profileImage)})`
              }"
            />
          </div>
          <div class="account-info">
            <p class="account-name">
              Logged in as
              {{ $accessor.user.username }}
            </p>
            <div @mouseup="closeAllPopups">
              <nuxt-link class="profile-btn" href="#" to="/profile">Your profile</nuxt-link>
            </div>
          </div>
        </div>
        <div class="menu-buttons" :class="{ authenticated: userAuthenticated }">
          <a
            v-show="!userAuthenticated"
            id="login-btn"
            v-tippy="'Sign in'"
            :href="`/login${currentPageRef('login')}`"
            class="ripple tooltip menu-btn account-btn"
            @click.self.prevent="login"
          >
            <div class="menu-btn-content"><AccountIcon />Sign in</div>
          </a>
          <a
            v-show="!userAuthenticated"
            id="register-btn"
            v-tippy="'Sign up'"
            :href="`/register${currentPageRef('register')}`"
            class="ripple tooltip menu-btn account-btn"
            @click.self.prevent="register"
          >
            <div class="menu-btn-content"><AccountPlusIcon />Sign up</div>
          </a>
          <a
            v-if="$route.name !== 'subscriptions' && userAuthenticated"
            id="subscriptions-btn"
            v-tippy="'View your subscriptions'"
            href="#"
            class="ripple tooltip menu-btn"
            @click.self.prevent="openSubscriptions"
          >
            <div class="menu-btn-content"><SubscriptionIcon />Subscriptions</div>
          </a>
          <a
            id="settings-btn"
            v-tippy="'Open settings'"
            href="#"
            class="ripple tooltip menu-btn"
            @mousedown.self.prevent="openSettings"
          >
            <div class="menu-btn-content"><SettingsIcon />Settings</div>
          </a>
          <a
            id="instances-btn"
            v-tippy="'View instances'"
            href="#"
            class="ripple tooltip menu-btn"
            @mousedown.self.prevent="openInstances"
          >
            <div class="menu-btn-content"><InstanceIcon />Instances</div>
          </a>
          <a
            id="about-btn"
            v-tippy="'Open about'"
            href="#"
            class="ripple tooltip menu-btn"
            @mousedown.self.prevent="openAbout"
          >
            <div class="menu-btn-content"><AboutIcon />About</div>
          </a>
        </div>
      </div>
    </transition>
    <portal to="popup">
      <transition name="fade-down">
        <Settings v-if="settingsOpen" @close="closeAllPopups" />
        <Instances v-if="instancesOpen" @close="closeAllPopups" />
        <About v-if="aboutOpen" @close="closeAllPopups" />
        <LoginForm v-if="loginOpen" class="center-popup" :complete="() => (loginOpen = false)" />
        <RegisterForm
          v-if="registerOpen"
          class="center-popup"
          :complete="() => (registerOpen = false)"
        />
      </transition>
    </portal>
    <div
      :class="{ visible: accountMenuVisible || loginOpen || registerOpen }"
      class="clickaway-div"
      @click="closeAllPopups"
    />
  </div>
</template>

<script lang="ts">
import SettingsIcon from 'vue-material-design-icons/Cog.vue';
import InstanceIcon from 'vue-material-design-icons/ServerNetwork.vue';
import AboutIcon from 'vue-material-design-icons/InformationOutline.vue';
import AccountIcon from 'vue-material-design-icons/AccountCircle.vue';
import SubscriptionIcon from 'vue-material-design-icons/YoutubeSubscription.vue';
import AccountPlusIcon from 'vue-material-design-icons/AccountPlus.vue';
import Settings from '@/components/Settings.vue';
import Instances from '@/components/Instances.vue';
import About from '@/components/About.vue';

import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  useRoute,
  useRouter,
  watch
} from '@nuxtjs/composition-api';
import { useAccessor } from '@/store/index';
import LoginForm from '../form/LoginForm.vue';
import RegisterForm from '../form/RegisterForm.vue';

export default defineComponent({
  name: 'UserMenu',
  components: {
    SettingsIcon,
    InstanceIcon,
    AboutIcon,
    AccountIcon,
    AccountPlusIcon,
    SubscriptionIcon,
    Settings,
    Instances,
    About,
    LoginForm,
    RegisterForm
  },
  setup() {
    const route = useRoute();
    const accessor = useAccessor();
    const router = useRouter();

    const accountMenuVisible = ref(false);
    const settingsOpen = ref(false);
    const instancesOpen = ref(false);
    const aboutOpen = ref(false);
    const loginOpen = ref(false);
    const registerOpen = ref(false);

    const onLoginClick = () => {
      closeAllPopups();
      loginOpen.value = true;
    };
    const onRegisterClick = () => {
      closeAllPopups();
      registerOpen.value = true;
    };

    const getProfileImageUrl = (url: string): string => {
      if (url) {
        const imgUrl = url.replace('/api/', '');
        return `${accessor.environment.apiUrl}${imgUrl}`;
      }
      return null;
    };

    const closeAllPopups = () => {
      registerOpen.value = false;
      loginOpen.value = false;
      aboutOpen.value = false;
      settingsOpen.value = false;
      instancesOpen.value = false;
      accountMenuVisible.value = false;
      if (accessor.popup.isPopupOpen) {
        accessor.popup.setPopupOpen(false);
      }
    };

    const currentRouteName = computed((): string => {
      return route.value.name;
    });

    const userAuthenticated = computed((): boolean => {
      return accessor.user.isLoggedIn;
    });

    const currentPageRef = (exclude: string) => {
      if (
        !route.value.fullPath.match(new RegExp(`.?${exclude}.?`, 'gi')) &&
        route.value.fullPath !== '/'
      ) {
        return `?ref=${route.value.fullPath}`;
      }
      return '';
    };

    const openPopup = (popupName: string): void => {
      closeAllPopups();
      switch (popupName) {
        case 'instances':
          openInstances();
          break;
        default:
          break;
      }
    };
    const showAccountMenu = (): void => {
      closeAllPopups();
      accountMenuVisible.value = !accountMenuVisible.value;
    };
    const openAbout = (): void => {
      closeAllPopups();
      accessor.popup.setPopupOpen(true);
      aboutOpen.value = true;
    };
    const openSettings = (): void => {
      closeAllPopups();
      accessor.popup.setPopupOpen(true);
      settingsOpen.value = true;
    };
    const openInstances = (): void => {
      closeAllPopups();
      accessor.popup.setPopupOpen(true);
      instancesOpen.value = true;
    };
    const openSubscriptions = (): void => {
      router.push('/subscriptions');
      closeAllPopups();
    };
    const login = (): void => {
      router.push(`/login${currentPageRef('login')}`);
      closeAllPopups();
    };
    const register = (): void => {
      router.push(`/register${currentPageRef('register')}`);
      closeAllPopups();
    };
    const logout = (): void => {
      accessor.user.logout();
      closeAllPopups();
    };

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllPopups();
      }
    };

    watch(
      () => accessor.popup.currentPopupName,
      (newValue: string, oldValue: string): void => {
        if (newValue && newValue !== oldValue && newValue.length > 0) {
          openPopup(newValue);
          accessor.popup.afterOpenPopup();
        }
      }
    );

    onMounted((): void => {
      window.addEventListener('keydown', onEscape);
    });

    onBeforeUnmount((): void => {
      window.removeEventListener('keydown', onEscape);
    });

    return {
      accountMenuVisible,
      settingsOpen,
      instancesOpen,
      aboutOpen,
      currentRouteName,
      userAuthenticated,
      currentPageRef,
      closeAllPopups,
      showAccountMenu,
      openAbout,
      openSettings,
      openInstances,
      openSubscriptions,
      getProfileImageUrl,
      login,
      logout,
      register,
      loginOpen,
      registerOpen,
      onLoginClick,
      onRegisterClick
    };
  }
});
</script>

<style lang="scss">
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 300ms $intro-easing, transform 300ms $intro-easing;
}
.fade-up-enter-to,
.fade-up-leave {
  opacity: 1;
  transform: translateY(0);
}
.fade-up-enter,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(50px);
}

.fade-down-enter-active,
.fade-down-leave-active {
  transition: transform 200ms $intro-easing, opacity 200ms $intro-easing;
}
.fade-down-enter-to,
.fade-down-leave {
  transform: scale(1);
  opacity: 1;
}
.fade-down-enter,
.fade-down-leave-to {
  transform: scale(1.1);
  opacity: 0;
}

.center-popup {
  position: absolute !important;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;

  &.login-form {
    max-height: 350px;
  }

  &.register-form {
    max-height: 700px;
  }
}

.clickaway-div {
  position: fixed;
  background-color: #0000008f;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  opacity: 0;
  transition: opacity 300ms $intro-easing;

  &.visible {
    opacity: 1;
    pointer-events: all;
  }
}

.nav {
  margin: auto 10px auto 5px;
  color: var(--theme-color);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  position: relative;
  z-index: +1;

  #account {
    color: var(--subtitle-color-light);
    &:focus {
      &::after {
        box-shadow: none;
      }
    }

    &.authenticated {
      width: auto;
      border-radius: 3px;

      .account-name {
        color: var(--theme-color);
        padding: 0 0 0 4px;
        @media screen and (max-width: $mobile-width) {
          display: none;
        }
      }

      @media screen and (max-width: $mobile-width) {
        height: 35px;
        .user-icon {
          height: 35px;
          width: 35px;

          .user-image {
            height: 35px !important;
            width: 35px !important;
          }
        }
      }

      .user-icon {
        .user-image {
          height: 24px;
          width: 24px;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .material-design-icon {
          .material-design-icon__svg {
            fill: var(--theme-color);
          }
        }
      }
    }
  }

  .menu {
    position: fixed;
    top: $header-height;
    right: 0;
    background-color: var(--bgcolor-alt);
    backdrop-filter: blur(15px);
    margin: 0 20px 0 0;
    border-radius: 3px;
    box-shadow: $max-shadow;
    padding: 10px 0 20px 0;
    width: 260px;
    height: auto;
    box-sizing: border-box;

    @media screen and (max-width: $mobile-width) {
      top: 100%;
      right: 0;
      left: 0;
      width: 100%;
      transform: translate(0, -100%);
    }

    .menu-buttons {
      display: grid;
      grid-template-columns: 45% 45%;
      column-gap: 10%;
      row-gap: 5%;
      height: auto;
      margin: 20px 5% 0 5%;

      @media screen and (max-width: $mobile-width) {
        grid-template-columns: 25% 25% 25% 25%;
        grid-template-rows: 70% !important;
        column-gap: 0 !important;
        row-gap: 0 !important;
        margin: 0 10px !important;

        &:not(.authenticated) {
          grid-template-columns: 20% 20% 20% 20% 20% !important;
        }

        .menu-btn {
          height: 80px !important;
        }
      }

      #login-btn,
      #register-btn {
        @media screen and (min-width: $mobile-width) {
          display: none;
        }
      }

      a.menu-btn {
        width: auto;
        margin: 0;
        justify-self: center;
        align-self: stretch;
        width: 100%;
        height: 60px;
        display: flex;
        border-radius: 3px;
        transition: box-shadow 300ms $intro-easing, border 300ms $intro-easing;
        border: 2px solid transparent;
        box-sizing: border-box;

        &::after {
          display: none;
        }

        &:hover,
        &:active,
        &:focus {
          border: 2px solid var(--theme-color);
        }

        .menu-btn-content {
          margin: auto;
          display: flex;
          flex-direction: column;
          color: var(--theme-color);

          .material-design-icon {
            margin: auto;
            width: 28px;
            height: 28px;

            .material-design-icon__svg {
              fill: var(--title-color);
              width: 28px;
              height: 28px;
            }
          }

          &.account-btn {
            display: none;

            @media screen and (max-width: $mobile-width) {
              display: block;
            }
          }
        }
      }
    }

    .account-menu {
      height: 50px;
      display: flex;
      flex-direction: row;
      padding: 0 0 0 20px;
      align-items: flex-start;

      .account-icon {
        margin: 4px 0 0 0;
        height: 40px;
        width: 40px;
        min-width: 42px;
        min-height: 42px;
        box-sizing: border-box;

        .user-image {
          height: 100%;
          width: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .account-circle-icon,
        .material-design-icon__svg {
          height: 40px;
          width: 40px;
          fill: var(--subtitle-color-light);
        }
      }

      .account-info {
        display: flex;
        flex-direction: column;
        margin: 0 0 0 0;
        width: 100%;

        .account-name {
          margin: 0 0 0 13px;
          width: 100%;
          color: var(--title-color);
        }

        .profile-btn {
          font-size: 0.9rem;
          width: 100%;
          margin: 0 0 0 10px;

          &:hover {
            text-decoration: underline;
          }

          &:focus {
            &::after {
              display: none;
            }
          }
        }
      }
    }
  }

  a:not(.nav-btn):not(.menu-btn) {
    text-decoration: none;
    color: var(--theme-color);
    transition: color 300ms $intro-easing;
    margin: 0 6px;
    display: flex;
    user-select: none;
    border-radius: 50%;
    padding: 3px;
    width: 24px;
    height: 24px;
    order: 99;

    i {
      margin: auto;
      height: 100%;
    }
  }

  .nav-btn {
    text-decoration: none;
    color: var(--theme-color);
    transition: color 300ms $intro-easing, border 300ms $intro-easing;
    margin: 0 5px;
    display: flex;
    user-select: none;
    border-radius: 3px;
    line-height: 100%;
    text-align: center;
    padding: 5px 10px;
    box-sizing: border-box;
    border: solid 2px transparent;
    min-width: 85px;

    &#login {
      min-width: 75px;
    }

    @media screen and (max-width: $mobile-width) {
      display: none;
    }

    &:hover {
      border: 2px solid var(--theme-color);
    }

    &:focus {
      border: 2px solid var(--theme-color);

      &::after {
        display: none !important;
      }
    }
  }

  .nav-btn.main {
    border: solid 2px var(--theme-color-translucent);
    border-radius: 3px;

    &:hover {
      border: 2px solid var(--theme-color);
    }
  }

  #open-in-yt {
    .yt-logo {
      width: 100%;
      fill: #fff;

      .st0 {
        fill: var(--theme-color);
      }

      .st1 {
        fill: var(--header-bgcolor);
      }
    }
  }
}
</style>
