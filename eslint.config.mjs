import js from '@eslint/js';
import { defineConfig }  from 'eslint/config';
import globals from 'globals';


export default defineConfig([
    {
        files: ['src/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jasmine,
            },
            ecmaVersion: 2018,
        },
        plugins: {
            js,
        },
        extends: ['js/recommended'],
    },
])
