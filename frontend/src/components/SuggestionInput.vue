<template>
  <div class="autocomplete">
    <input
      :value="inputValue"
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
        :key="item.id"
        @mousedown.prevent="selectSuggestion(item)"
        class="suggestion-item"
      >
        {{ item.name }}
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
      default: '', // this is the product ID
    },
    suggestions: {
      type: Array, // array of { id, name }
      required: true,
    },
  },
  data() {
    return {
      inputValue: '', // this will hold the display name
      filtered: [],
      showSuggestions: false,
    }
  },
  watch: {
    // when modelValue (id) changes from outside, update the input display name
    modelValue: {
      immediate: true,
      handler(newId) {
        const selected = this.suggestions.find((p) => p.id === newId)
        this.inputValue = selected ? selected.name : ''
      },
    },
  },
  methods: {
    onInput(event) {
      this.inputValue = event.target.value
      this.filterSuggestions(this.inputValue)
    },
    filterSuggestions(value = '') {
      const search = typeof value === 'string' ? value.toLowerCase().trim() : ''
      if (!search) {
        // this.filtered = []
        this.filtered = this.suggestions
        this.showSuggestions = true
        // this.showSuggestions = false
        return
      }
      this.filtered = this.suggestions.filter((item) => item.name.toLowerCase().includes(search))
      this.showSuggestions = true
    },
    selectSuggestion(item) {
      this.inputValue = item.name // display name
      this.$emit('update:modelValue', item.id) // emit id
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
