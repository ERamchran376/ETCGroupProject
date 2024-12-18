<template>
  <div>
    <h1>Home Page</h1>
    <div class="q-pa-md">
    <q-page>
      <q-table
        title="Records"
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :filter="filter"
        row-key="id"
        flat
        bordered
      >

      <template v-slot:top-left>
          <q-btn color="white" text-color="black" :disable="loading" label="Add row" @click="addRow" />
          <q-btn v-if="rows.length !== 0" class="q-ml-sm" :disable="loading" color="white" text-color="black" label="Remove row" @click="removeRow" />
        <q-space />
      </template>

      <template v-slot:top-right>
        <q-btn color="white" :disable="loading" text-color="black" label="Save" @click="save" />
        <q-btn color="white" :disable="loading" id="Sync" class="q-ml-sm" text-color="black" label="Sync" @click="sync" />
        <q-space />
      </template>

      <template v-slot:body-cell="props">
      <q-td :props="props">
        <q-input
          v-model.number="props.row[ props.col.name ]"
          input-class="text-right"
          type="text"
          dense
          borderless
        />
      </q-td>
      </template>
      </q-table>
    </q-page>
  </div>
  </div>
</template>

<script src="../scripts/HomePage.ts" lang="ts"></script>
