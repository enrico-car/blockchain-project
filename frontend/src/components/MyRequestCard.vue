<template>
  <div class="my-request-card">
    <div class="card-header">
      <div class="product-info">
        <h4 class="product-name">{{ request.productName }}</h4>
        <div class="status-container">
          <span :class="['status-badge', statusConfig.class]">
            {{ statusConfig.label }}
          </span>
        </div>
      </div>
    </div>

    <div class="card-body">
      <div class="request-date">
        <span class="date-label">Date:</span>
        <span class="date-value">{{ formatDate(request.requestDate) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    request: {
      type: Object,
      required: true,
    },
  },
  computed: {
    statusConfig() {
      const configs = {
        pending: {
          label: 'Pending',
          class: 'status-pending',
        },
        approved: {
          label: 'Approved',
          class: 'status-approved',
        },
        rejected: {
          label: 'Declined',
          class: 'status-rejected',
        },
      }
      return configs[this.request.status] || configs.pending
    },
  },
  methods: {
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
  },
}
</script>

<style scoped>
.my-request-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.my-request-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.card-header {
  margin-bottom: 1rem;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.product-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  flex: 1;
  min-width: 0;
}

.status-container {
  display: flex;
  justify-content: flex-start;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.status-icon {
  font-size: 1rem;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.request-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.date-value {
  font-size: 0.875rem;
  color: #2c3e50;
  font-weight: 500;
}
</style>
