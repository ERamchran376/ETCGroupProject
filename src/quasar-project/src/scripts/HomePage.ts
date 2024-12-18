import api from 'src/services/api';
import { defineComponent, ref, onMounted } from 'vue';
import { QTableColumn } from 'quasar';
import { v4 as uuidv4 } from 'uuid';

export default defineComponent({
  name: 'recordsTable',

  setup() {
    const loading = ref(false);
    const filter = ref('');
    const rowCount = ref(10);
    const columns:QTableColumn[] = [
      { name: 'id', label: 'ID', field: 'id', sortable: true, required: true },
      { name: 'title', label: 'Title', field: 'title', sortable: true, required:true },
      { name: 'description', label: 'Description', field: 'description', sortable: true, required:true },
      { name: 'barcode', label: 'Barcode', field: 'barcode', sortable: true },
      { name: 'updated_at', label: 'Updated At', field: 'updated_at', sortable: true, required: true },
    ]

    const rows = ref<unknown[]>([]);

    const checkToken = async () => {
      try {
        await api.checkToken();
      } catch (err) {
        console.error(err);
        window.location.href = '/#/';
        alert('Session expired. Redirecting to login page!');
      }
    };

    const getTableData = async () => {
        try {
          const data = await api.getRecordsView();
          rows.value = data.data;
        } catch (err) {
          console.error('Error fething rows:',err);
        }
    };

    const addRow = () => {
      loading.value = true
        setTimeout(() => {
          const index = rows.value.length + 1

          if (rows.value.length === 0) {
            rowCount.value = 0
          }

          const newRow = {id: uuidv4(), title: '', description: '', barcode: '', updated_at: getCurrentTimestamp()}
          rows.value = [ ...rows.value.slice(0, index), newRow ]
          loading.value = false
        }, 500)
    };

    const removeRow = () => {
      loading.value = true
        setTimeout(() => {
          const index = rows.value.length - 1
          rows.value = [ ...rows.value.slice(0, index) ]
          loading.value = false
        }, 500)
    };

    const save = async () => {
      loading.value = true
      try {
        api.updateRecords(rows.value);
      } catch (err) {
        console.error('Error:', err);
      }

      setTimeout(() => {
        loading.value = false
      }, 500)

    };

    const sync = async () => {
      loading.value = true
      try {
        await api.syncDB(rows.value);
      } catch (err) {
        console.error('Error:', err);
      }

      setTimeout(() => {
        loading.value = false
      }, 500)

    };

    const getCurrentTimestamp = () => {
      const now = new Date();
      const pad = (num: number, size: number = 2): string => String(num).padStart(size, '0');
      const year = now.getFullYear();
      const month = pad(now.getMonth() + 1);
      const day = pad(now.getDate());
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());
      const milliseconds = pad(now.getMilliseconds(), 6);

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    };

    onMounted(() => {
      checkToken();
      getTableData();
    });

    return {
      columns,
      rows,
      loading,
      filter,
      addRow,
      removeRow,
      save,
      sync
    };
  },
});
