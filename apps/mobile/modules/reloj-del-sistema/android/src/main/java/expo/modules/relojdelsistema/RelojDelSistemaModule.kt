package expo.modules.relojdelsistema

import android.os.SystemClock
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * El reloj desde el arranque del teléfono, para los tiempos de entrenamiento (DL-124; precierre del 2026-10-06, §3).
 *
 * - `msDesdeElArranque`: `SystemClock.elapsedRealtimeNanos()` en milisegundos. Es monotónico y sigue contando mientras
 *   el teléfono duerme (CLOCK_BOOTTIME); cambiar la hora del teléfono no lo altera. `performance.now()` de React Native,
 *   en cambio, es CLOCK_MONOTONIC y no cuenta el reposo profundo.
 * - `numeroDeArranque`: `Settings.Global.BOOT_COUNT`, o `null` si el sistema no lo da. Sirve para saber, después de
 *   reabrir la app, si el teléfono se reinició: con otro arranque, el reloj vuelve a cero. No sale del teléfono.
 *
 * Las dos son funciones sincrónicas: no despiertan nada ni dejan nada corriendo.
 * Referencia: https://developer.android.com/reference/android/os/SystemClock
 */
class RelojDelSistemaModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RelojDelSistema")

    Function("msDesdeElArranque") {
      SystemClock.elapsedRealtimeNanos() / 1_000_000.0
    }

    Function("numeroDeArranque") {
      val resolver = appContext.reactContext?.contentResolver ?: return@Function null
      try {
        Settings.Global.getInt(resolver, Settings.Global.BOOT_COUNT)
      } catch (e: Settings.SettingNotFoundException) {
        null
      }
    }
  }
}
