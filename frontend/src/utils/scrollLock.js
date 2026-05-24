/**
 * Utilidad de bloqueo de scroll con contador.
 *
 * Problema que resuelve: si dos modales llaman a
 * document.body.style.overflow = 'hidden' / '' de forma independiente,
 * el que cierra primero restaura el scroll aunque el otro siga abierto.
 *
 * Con este contador, el scroll solo se restaura cuando TODOS los
 * consumidores hayan liberado su bloqueo.
 */

let lockCount = 0

export function lockScroll() {
  lockCount++
  document.body.style.overflow = 'hidden'
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = ''
  }
}
