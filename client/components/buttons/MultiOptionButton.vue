<template>
  <div class="multi-option" :class="{ right: right }">
    <div class="multi-option-body">
      <div
        v-for="(option, index) in options"
        :key="index"
        class="option"
        :class="{ selected: selectedValue === option.value }"
        @click="onOptionSelect(option)"
      >
        <p>
          {{ option.label }}
        </p>
      </div>
    </div>
    <label v-if="label" class="label"
      ><span :style="{ 'background-color': colorMark }" />
      <div class="label-container">
        <p class="label-text">{{ label }}</p>
        <p v-if="smallLabel" class="label-small">{{ smallLabel }}</p>
      </div>
    </label>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'MultiOptionButton',
  props: {
    selectedValue: String,
    options: Array,
    label: String,
    colorMark: String,
    disabled: {
      type: Boolean,
      required: false
    },
    right: {
      type: Boolean,
      required: false
    },
    smallLabel: {
      type: String,
      required: false
    }
  },
  created() {
    if (!this.options || new Set(this.options).size !== this.options.length) {
      throw new Error(`MultiOptionButton with label "${this.label}" has duplicate options.`);
    }
  },
  methods: {
    onOptionSelect(option) {
      this.$emit('valuechange', option);
    }
  }
});
</script>

<style lang="scss" scoped>
.multi-option {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  user-select: none;
  margin-top: 20px !important;
  position: relative;
  align-items: center;

  &.right {
    flex-direction: row-reverse;
    width: calc(100% - 40px);

    .label {
      flex-grow: 1;
      text-align: start;
      margin: 0;
    }
  }

  .multi-option-body {
    background-image: $theme-color-primary-gradient;
    border-radius: 5px;
    display: flex;
    padding: 3px 0 3px 3px;

    .option {
      padding: 2px 5px;
      margin: 0 3px 0 0;
      background-color: var(--bgcolor-alt);
      cursor: pointer;
      color: var(--title-color);
      transition: background-color 300ms $intro-easing, color 300ms $intro-easing;

      &.selected {
        background-color: transparent;
        color: #000;
      }

      &:nth-of-type(1) {
        border-radius: 3px 0 0 3px;
      }

      &:last-of-type {
        border-radius: 0 3px 3px 0;
      }

      p {
      }
    }
  }

  .label {
    line-height: 32px;
    text-align: center;
    margin: 0 0 0 10px;
    display: flex;
    flex-direction: row;

    .label-container {
      display: inline-flex;
      flex-direction: column;

      .label-text {
        line-height: 24px;
      }
      .label-small {
        font-size: 0.8rem;
        line-height: 20px;
      }
    }

    span {
      width: 10px;
      height: 10px;
      border-radius: 25px;
      margin: 6px 6px 0 0;
      display: inline-block;
    }
  }
}
</style>