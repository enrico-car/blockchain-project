<template>
  <div class="autocomplete">
    <input
      :value="modelValue"
      @input="onInput"
      @focus="filterSuggestions"
      @blur="hideSuggestions"
      type="text"
      class="autocomplete-input"
      placeholder="Search Product..."
      required
    />

    <ul v-if="showSuggestions && filtered.length" class="suggestions">
      <li
        v-for="(item, index) in filtered"
        :key="index"
        @mousedown.prevent="selectSuggestion(item)"
        class="suggestion-item"
      >
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'AutocompleteInput',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    suggestions: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      filtered: [],
      showSuggestions: false,
    }
  },
  methods: {
    onInput(event) {
      const value = event.target.value
      this.$emit('update:modelValue', value)
      this.filterSuggestions(value)
    },
    filterSuggestions(value) {
      const search = value?.toLowerCase().trim() || ''
      if (!search) {
        this.filtered = []
        this.showSuggestions = false
        return
      }
      this.filtered = this.suggestions.filter((item) => item.toLowerCase().includes(search))
      this.showSuggestions = true
    },
    selectSuggestion(item) {
      this.$emit('update:modelValue', item)
      this.showSuggestions = false
    },
    hideSuggestions() {
      setTimeout(() => {
        this.showSuggestions = false
      }, 150)
    },
  },
}
</script>

<style scoped>
.autocomplete {
  position: relative;
  /* max-width: 400px; */
  width: 100%;
}

.suggestions {
  list-style: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  background: white;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.suggestion-item {
  padding: 0.5rem;
  cursor: pointer;
}

.suggestion-item:hover {
  background-color: #f0f0f0;
}
</style>
