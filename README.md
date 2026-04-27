# 🏠 Equilive | The Intelligent Harmony Engine for Shared Living

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

## 🔗 Overview / Resumen

**Equilive** is a premium ecosystem designed to eliminate friction in shared housing. It’s not just a task manager; it’s a "Harmony Engine" that balances domestic responsibilities and finances with mathematical precision and a high-end user experience. Built with a "Zero Latency" philosophy, it ensures that living together is actually about living, not arguing.

---

## 🇪🇸 Versión en Español

### 🚀 El Proyecto
Equilive nace para terminar con el "quilombo" de la convivencia. Es una plataforma integral que transforma la gestión del hogar en una experiencia fluida y transparente. Olvidate de las listas de papel o los mensajes de WhatsApp que se pierden; el sistema utiliza un motor de inteligencia colectiva para asignar tareas de forma justa y liquidar deudas sin vueltas.

### ✨ Características Destacadas
- **Fairness Engine (Algoritmo de Equidad):** Asignación inteligente de tareas basada en Karma, recencia y carga de trabajo. Si ya limpiaste el baño ayer, el sistema lo sabe y le toca a otro.
- **Liquidación de Deudas 1-a-1:** Motor financiero que resuelve saldos cruzados de forma eficiente. Cuentas claras, amistades largas.
- **Symmetry UI v2.0:** Diseño ultra-premium con Glassmorphism, jerarquía tipográfica refinada y micro-interacciones que hacen que usar la app sea un placer.
- **Sincronización en Tiempo Real:** Notificaciones instantáneas vía WebSockets (Socket.io) para alertas de emergencia, pagos y tareas completadas.
- **Sistema de Karma:** Gamificación de la convivencia. Cumplí con tus tareas, pagá a tiempo y convertite en el "Alma de la Casa".

### 🛠️ Stack Tecnológico & Arquitectura
- **Frontend:** React 19 + Vite + Tailwind CSS + Framer Motion + Zustand (Estado granular).
- **Backend:** Node.js & Express (Arquitectura de servicios desacoplada).
- **Base de Datos:** PostgreSQL con Prisma ORM para una integridad de datos absoluta.
- **Real-time:** Socket.io para actualizaciones sin recarga de página.

---

## 🇺🇸 English Version

### 🚀 The Project
Equilive is a high-end platform designed to eradicate shared-housing friction. It’s an intelligent ecosystem that prioritizes transparency and domestic balance. By integrating financial settlement algorithms with an AI-driven task recommendation engine, Equilive ensures that every member contributes fairly and every debt is paid accurately.

### 🌟 Key Features
- **Fairness Engine:** An intelligent heuristic (Karma 40%, Recency 40%, Workload 20%) that suggests the ideal person for any task, avoiding burnout and repetition.
- **Efficient Debt Settlement:** A greedy algorithm-based engine that simplifies multi-user debts into direct, easy-to-settle transactions.
- **Extreme Glassmorphism UI:** A sleek, dark-mode interface with "Top-Edge Lighting" and fluid animations for a production-ready feel.
- **Real-Time Synergy:** Immediate updates for emergency alerts and financial liquidations powered by Socket.io.
- **Zero Latency Architecture:** Optimized SQL queries and parallelized async operations for a smooth, lag-free experience.

### ⚙️ Tech Stack & Architecture
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Zustand.
- **Backend:** Node.js, Express, Prisma ORM.
- **Database:** PostgreSQL (Cloud-ready).
- **Communication:** WebSockets for instant state synchronization.

---

## 🛠️ Instalación / Installation

1. **Clona el repositorio / Clone the repo:**
   ```bash
   git clone https://github.com/alfredoenei/Equilive.git
   ```

2. **Configuración / Configuration:**
   Configura las variables de entorno en `/backend/.env` (DATABASE_URL, JWT_SECRET) y `/frontend/.env` (VITE_API_URL). Revisa los `.env.example` en cada carpeta.

3. **Lanza el proyecto / Launch the project:**

   **Backend:**
   ```bash
   cd backend && npm install && npx prisma generate && npm run dev
   ```

   **Frontend:**
   ```bash
   cd frontend && npm install && npm run dev
   ```

---
**Desarrollado por Alf**
