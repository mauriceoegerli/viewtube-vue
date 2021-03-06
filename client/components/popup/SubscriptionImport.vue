<template>
  <div class="subscriptions-import popup">
    <div class="popup-container subscriptions-import-container">
      <CloseIcon class="close-icon" @click.stop="$emit('close')" />
      <h1>
        {{
          loading
            ? 'Importing subscriptions'
            : page3
            ? 'Imported subscriptions'
            : 'Import subscriptions'
        }}
      </h1>
      <div class="pages-container" :class="{ 'page-2': page2 }">
        <div class="page-container page-1-container">
          <h2><YoutubeIcon />Import from Youtube</h2>
          <ol>
            <li class="links">
              Go to
              <a target="_blank" rel="noreferrer noopener" :href="youtubeSubscriptionUrl">{{
                youtubeSubscriptionUrl
              }}</a
              >.
            </li>
            <li>You may be asked to sign in.</li>
            <li>Download the file with the name "subscription_manager".</li>
            <li>Upload it here.</li>
          </ol>
          <input
            id="youtube-file-upload"
            type="file"
            name="file-upload"
            multiple="false"
            @change="onYoutubeSubscriptionFileChange"
          />
          <p>Also supports invidious opml exports.</p>
        </div>
        <div
          v-if="subscriptionsToImport && subscriptionsToImport.length > 0"
          class="page-container page-2-container"
        >
          <h2>Select subscriptions to import</h2>
          <div class="list-actions">
            <div class="left">
              <BadgeButton :click="selectAll">
                <SelectAllIcon />
                <p>Select all</p>
              </BadgeButton>
              <BadgeButton :click="unselectAll">
                <UnselectAllIcon />
                <p>Unselect all</p>
              </BadgeButton>
            </div>
            <div class="right">
              <BadgeButton :click="importSelected" :disabled="anySelectedChannel">
                <ImportIcon />
                <p>Import</p>
              </BadgeButton>
            </div>
          </div>
          <div class="subscription-channels-container">
            <div
              v-for="channel in subscriptionsToImport"
              :key="channel.authorId"
              class="subscription"
            >
              <CheckBox
                :value="channel.selected"
                :label="channel.author"
                @valuechange="e => channelCheckBoxChanged(e, channel.authorId)"
              />
            </div>
          </div>
        </div>
        <div v-if="importedSubscriptions" class="page-container page-3-container">
          <h2>Import results</h2>
          <h3 v-if="successfulMergedImports.length > 0">
            {{ successfulMergedImports.length }} successful import{{
              successfulMergedImports.length !== 1 ? 's' : ''
            }}
          </h3>
          <div v-if="successfulMergedImports.length > 0" class="import-area">
            <div class="import-list">
              <p v-for="subscription in successfulMergedImports" :key="subscription.authorId">
                {{ subscription.author }}
              </p>
            </div>
          </div>
          <h3 v-if="existingMergedImports.length > 0">
            {{ existingMergedImports.length }} already existing subscription{{
              existingMergedImports.length !== 1 ? 's' : ''
            }}
          </h3>
          <div v-if="existingMergedImports.length > 0" class="import-area">
            <div class="import-list">
              <p v-for="subscription in existingMergedImports" :key="subscription.authorId">
                {{ subscription.author }}
              </p>
            </div>
          </div>
          <h3 v-if="failedMergedImports.length > 0">
            {{ failedMergedImports.length }} failed import{{
              failedMergedImports.length !== 1 ? 's' : ''
            }}
          </h3>
          <div v-if="failedMergedImports.length > 0" class="import-area">
            <div class="import-list">
              <a
                v-for="subscription in failedMergedImports"
                :key="subscription.authorId"
                :href="`/channel/${subscription.authorId}`"
                target="_blank"
                ><ExternalIcon />{{ subscription.author }}</a
              >
            </div>
          </div>
        </div>
        <div class="loading-overlay" :class="{ loading }">
          <Spinner />
          <p class="loading-text">This can take a while</p>
        </div>
      </div>
    </div>
    <div class="settings-overlay popup-overlay" @click.stop="onTryClosePopup" />
  </div>
</template>

<script lang="ts">
import CloseIcon from 'vue-material-design-icons/Close.vue';
import YoutubeIcon from 'vue-material-design-icons/Youtube.vue';
import ImportIcon from 'vue-material-design-icons/Import.vue';
import SelectAllIcon from 'vue-material-design-icons/SelectAll.vue';
import ExternalIcon from 'vue-material-design-icons/OpenInNew.vue';
import UnselectAllIcon from 'vue-material-design-icons/Select.vue';
import CheckBox from '@/components/form/CheckBox.vue';
import BadgeButton from '@/components/buttons/BadgeButton.vue';
import SubscriptionConverter from '@/plugins/services/subscriptionConverter';
import Spinner from '@/components/Spinner.vue';
import '@/assets/styles/popup.scss';
import { computed, defineComponent, ref } from '@nuxtjs/composition-api';
import { useAxios } from '@/plugins/axiosPlugin';
import { useAccessor } from '@/store/index';

class ChannelDto {
  author: string;
  authorId: string;
  selected?: boolean;
}

export default defineComponent({
  name: 'SubscriptionsImport',
  components: {
    CloseIcon,
    YoutubeIcon,
    CheckBox,
    BadgeButton,
    ImportIcon,
    SelectAllIcon,
    UnselectAllIcon,
    Spinner,
    ExternalIcon
  },
  setup(_, { emit }) {
    const axios = useAxios();
    const accessor = useAccessor();

    const youtubeSubscriptionUrl = ref(
      'https://www.youtube.com/subscription_manager?action_takeout=1'
    );
    const page2 = ref(false);
    const page3 = ref(false);
    const subscriptionsToImport = ref(null);
    const loading = ref(false);
    const importedSubscriptions = ref(null);

    const selectedChannels = computed(
      (): Array<ChannelDto> => {
        return subscriptionsToImport.value.filter((e: { selected: any }) => e.selected);
      }
    );
    const anySelectedChannel = computed((): boolean => {
      return !(selectedChannels.value.length > 0);
    });

    const successfulMergedImports = computed(
      (): Array<ChannelDto> => {
        if (importedSubscriptions.value && importedSubscriptions.value.successful) {
          return importedSubscriptions.value.successful.map((el: { channelId: any }) => {
            const authorObj = subscriptionsToImport.value.find(
              (val: { authorId: any }) => val.authorId === el.channelId
            );
            return {
              authorId: el.channelId,
              author: authorObj ? authorObj.author : null
            };
          });
        }
        return [];
      }
    );

    const existingMergedImports = computed(
      (): Array<ChannelDto> => {
        if (importedSubscriptions.value && importedSubscriptions.value.existing) {
          return importedSubscriptions.value.existing.map(el => {
            const authorObj = subscriptionsToImport.value.find(
              val => val.authorId === el.channelId
            );
            return {
              authorId: el.channelId,
              author: authorObj ? authorObj.author : null
            };
          });
        }
        return [];
      }
    );

    const failedMergedImports = computed(
      (): Array<ChannelDto> => {
        if (importedSubscriptions.value && importedSubscriptions.value.failed) {
          return importedSubscriptions.value.failed.map((el: { channelId: any }) => {
            const authorObj = subscriptionsToImport.value.find(
              (val: { authorId: any }) => val.authorId === el.channelId
            );
            return {
              authorId: el.channelId,
              author: authorObj ? authorObj.author : null
            };
          });
        }
        return [];
      }
    );

    const onTryClosePopup = () => {
      if (!(page2.value || page2.value)) {
        emit('close');
      }
    };

    const onYoutubeSubscriptionFileChange = (e: any) => {
      const fileReader: any = new FileReader();
      fileReader.onload = () => {
        subscriptionsToImport.value = SubscriptionConverter.convertFromYoutubeOPMLToJson(
          fileReader.result
        )
          .sort((a: { author: string }, b: { author: string }) => a.author.localeCompare(b.author))
          .map(({ author, authorId }) => ({
            author,
            authorId,
            selected: true
          }));
        page2.value = true;
      };
      fileReader.readAsText(e.target.files[0]);
    };

    const channelCheckBoxChanged = (newValue: any, channelId: any) => {
      subscriptionsToImport.value.find(
        (e: { authorId: string }) => e.authorId === channelId
      ).selected = newValue;
    };

    const selectAll = () => {
      subscriptionsToImport.value.forEach((el: { selected: boolean }) => {
        el.selected = true;
      });
    };

    const unselectAll = () => {
      subscriptionsToImport.value.forEach((el: { selected: boolean }) => {
        el.selected = false;
      });
    };

    const importSelected = () => {
      loading.value = true;
      const subscriptions = selectedChannels.value;
      const subscriptionIds = subscriptions.map(e => e.authorId);
      axios
        .post(
          `${accessor.environment.apiUrl}user/subscriptions/multiple`,
          {
            channels: subscriptionIds
          },
          {
            withCredentials: true
          }
        )
        .then(response => {
          page2.value = false;
          page3.value = true;
          loading.value = false;
          importedSubscriptions.value = response.data;
          emit('done');
        });
    };

    return {
      youtubeSubscriptionUrl,
      page2,
      page3,
      subscriptionsToImport,
      loading,
      importedSubscriptions,
      selectedChannels,
      anySelectedChannel,
      successfulMergedImports,
      existingMergedImports,
      failedMergedImports,
      onTryClosePopup,
      onYoutubeSubscriptionFileChange,
      channelCheckBoxChanged,
      selectAll,
      unselectAll,
      importSelected
    };
  }
});
</script>

<style lang="scss">
.subscriptions-import {
  .subscriptions-import-container {
    .pages-container {
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      position: relative;
      box-sizing: border-box;
      margin: 0;

      .loading-overlay {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 11;
        background-color: var(--bgcolor-alt);
        opacity: 0;
        pointer-events: none;
        transition: opacity 300ms $intro-easing;

        .loading-text {
          position: absolute;
          top: 55%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .spinner {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        &.loading {
          opacity: 1;
          pointer-events: all;
        }
      }

      .page-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: hidden scroll;
        background-color: var(--bgcolor-alt);
      }

      // .page-1-container {
      // }
      .page-2-container {
        pointer-events: none;
        user-select: none;
        opacity: 0;
        transform: translateX(10px);
        transition: transform 300ms $overshoot-easing, opacity 300ms $intro-easing;

        .list-actions {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        }

        h2 {
          padding: 10px 0;
        }

        .subscription-channels-container {
          display: flex;
          flex-direction: column;

          .subscription {
            display: flex;
            flex-direction: row;
            margin: 10px 0;

            .checkbox {
              width: 100%;

              .label {
                flex-grow: 1;
                text-align: start;
              }
            }
          }
        }
      }

      .page-3-container {
        display: flex;
        flex-direction: column;
        height: 100%;

        .import-area {
          flex-grow: 1;
          height: 100%;
          overflow: hidden auto;
          background-color: var(--bgcolor-main);

          .import-list {
            font-size: 0.9rem;

            a {
              display: block;
              span {
                width: 16px;
                height: 16px;
                svg {
                  width: 16px;
                  height: 16px;
                }
              }
            }
          }
        }
      }

      &.page-2 {
        .page-2-container {
          pointer-events: auto;
          user-select: auto;
          transform: translateX(0);
          opacity: 1;
        }
      }
    }
  }
}
</style>
