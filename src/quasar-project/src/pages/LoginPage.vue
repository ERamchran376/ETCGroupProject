<template>
  <div class="q-pa-md">
  <div class="q-gutter-y-md column" style="max-width: 300px">
    <h1>Login</h1>
    <q-input v-model="username" type="text" id="username" label="Username" />
    <q-input v-model="password" type="password" id="password" label="Password" />
    <br>
    <q-btn color="white" text-color="black" label="Register" @click="addUser"/>
    <q-btn color="white" id="Login" text-color="black" label="Login" @click="login"/>
  </div>
  </div>
</template>

<script src="../scripts/LoginPage.ts" lang="ts"></script>
