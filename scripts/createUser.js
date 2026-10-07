/**
 * Script interactivo y CLI para crear nuevos usuarios bajo demanda.
 *
 * Uso interactivo:
 *   npm run create-user
 *
 * Uso con parámetros directos:
 *   node scripts/createUser.js --email=tienda@ejemplo.com --password=MiPassword123 --slug=tienda-yugi --whatsapp=+573001234567
 */

'use strict';

require('dotenv').config();
const readline = require('readline');
const crypto = require('crypto');
const admin = require('firebase-admin');
require('../src/config/firebase'); // Inicializa Firebase Admin según .env
const userRepository = require('../src/repositories/userRepository');
const { invalidateSlugCache } = require('../src/utils/slugToUid');

function ask(rl, question, defaultValue = '') {
  return new Promise((resolve) => {
    const promptText = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(promptText, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, ...values] = arg.slice(2).split('=');
      args[key] = values.join('=');
    }
  });
  return args;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidSlug(slug) {
  return /^[a-z0-9-]+$/.test(slug);
}

function isValidWhatsApp(phone) {
  return !phone || /^\+?[0-9]{10,15}$/.test(phone);
}

function generateRandomPassword() {
  return crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, 'x') + '!9A';
}

async function run() {
  console.log('\n======================================================');
  console.log('       Yu-Gi-Oh! Inventory - Creador de Usuarios       ');
  console.log('======================================================\n');

  const args = parseArgs();
  const isInteractive = Object.keys(args).length === 0;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // 1. Obtener y validar Email
    let email = args.email;
    while (!email || !isValidEmail(email)) {
      if (email && !isValidEmail(email)) {
        console.log('❌ Formato de correo electrónico inválido. Intenta de nuevo.');
      }
      if (!isInteractive && args.email) {
        throw new Error('Email proporcionado no es válido');
      }
      email = await ask(rl, '📧 Correo electrónico');
    }
    email = email.toLowerCase().trim();

    // Comprobar si ya existe en Firebase Auth
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      if (existingUser) {
        throw new Error(`Ya existe un usuario registrado con el correo: ${email} (UID: ${existingUser.uid})`);
      }
    } catch (err) {
      if (err.code !== 'auth/user-not-found') {
        throw err;
      }
    }

    // 2. Obtener y validar Contraseña
    let password = args.password;
    if (!password) {
      if (isInteractive) {
        const defaultPassword = generateRandomPassword();
        const pwdInput = await ask(rl, `🔑 Contraseña (deja vacío para autogenerar)`, defaultPassword);
        password = pwdInput || defaultPassword;
      } else {
        password = generateRandomPassword();
      }
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    // 3. Obtener y validar Slug (nombre de tienda / usuario para URL pública)
    const suggestedSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
    let slug = args.slug;
    
    while (!slug) {
      if (isInteractive) {
        slug = await ask(rl, `🌐 Slug / Nombre de tienda (/portfolio/<slug>)`, suggestedSlug);
      } else {
        slug = suggestedSlug;
      }
      slug = slug.toLowerCase().trim();

      if (!isValidSlug(slug)) {
        console.log('❌ El slug solo puede contener letras minúsculas, números y guiones (-).');
        slug = null;
        if (!isInteractive) throw new Error('Slug inválido.');
        continue;
      }

      const isTaken = await userRepository.isSlugTaken(slug, null);
      if (isTaken) {
        console.log(`❌ El slug "${slug}" ya está en uso por otra tienda. Elige uno diferente.`);
        slug = null;
        if (!isInteractive) throw new Error(`El slug "${slug}" ya está en uso.`);
      }
    }

    // 4. Obtener WhatsApp (Opcional)
    let whatsapp = args.whatsapp || '';
    if (isInteractive && !whatsapp) {
      const phoneInput = await ask(rl, '📱 WhatsApp con código de país (opcional, ej: +573001234567)');
      whatsapp = phoneInput.trim();
    }
    if (whatsapp && !isValidWhatsApp(whatsapp)) {
      throw new Error('Formato de WhatsApp inválido (debe contener entre 10 y 15 dígitos numéricos).');
    }

    rl.close();

    console.log('\n⏳ Creando usuario en Firebase Auth y perfil en Firestore...');

    // 5. Crear usuario en Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: slug,
    });

    // 6. Crear perfil en Firestore
    await userRepository.updateProfile(
      userRecord.uid,
      email,
      slug,
      whatsapp || null,
      48 // Límite estándar de 48h para reservas
    );

    invalidateSlugCache(slug);

    console.log('\n✅ ¡Usuario creado con éxito!');
    console.log('──────────────────────────────────────────────────────');
    console.log(`🆔 UID:               ${userRecord.uid}`);
    console.log(`📧 Email:             ${email}`);
    console.log(`🔑 Contraseña:        ${password}`);
    console.log(`🌐 Slug público:      ${slug}`);
    if (whatsapp) {
      console.log(`📱 WhatsApp:          ${whatsapp}`);
    }
    console.log(`🔗 Portafolio:        /portfolio/${slug}`);
    console.log(`🔐 Acceso Admin:      /login`);
    console.log('──────────────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    rl.close();
    console.error(`\n❌ Error al crear usuario: ${error.message}\n`);
    process.exit(1);
  }
}

run();
