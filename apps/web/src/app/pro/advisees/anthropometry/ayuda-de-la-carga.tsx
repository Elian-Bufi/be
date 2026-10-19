'use client';

/**
 * «Cómo se lee esta vista», para la carga de una toma (WP-ESCRITORIO-AREAS, parte 9; F-14): qué es una toma en
 * preparación, cómo se lee la figura, guardar y registrar, y qué hacer con lo que el protocolo no declara. Junta lo que
 * estaba plegado o al pie en la pantalla de antes («Qué es una toma en preparación», «Tocá un punto para ir a su campo»,
 * la explicación de las clases del dato). Los textos que el dominio ya fija con una prueba se usan como están.
 */
import { COPY_ANTROPOMETRIA as C } from '@be/domain';
import { AyudaDeVista, RenglonDeAyuda as Renglon } from '../../../../components/ayuda-de-vista';
import { Icono } from '../../../../components/icono';

export function AyudaDeLaCarga() {
  return (
    <AyudaDeVista titulo="Cómo se lee la carga de una toma" deQue="antropometria-carga">
      <p className="nota">Donde se cargan las mediciones de una toma, sobre la figura. La figura ubica cada medida: no califica ningún valor.</p>
      <ul className="como-se-lee__lista">
        <Renglon esencial muestra={<Icono nombre="borrador" tamano={20} />}>
          <strong>Una toma en preparación es un borrador.</strong> {C.borradorNoEsHistoria} «Guardar» la deja guardada para seguir después; «Registrar toma» la vuelve parte de la historia, guarda antes lo que está
          en pantalla y pide confirmación: después no se edita.
        </Renglon>
        <Renglon muestra={<Icono nombre="protocolo" tamano={20} />}>
          <strong>Qué se mide lo declara el protocolo.</strong> Lo que tiene sitio en la figura se carga en la figura; lo demás que declara (peso, talla, diámetros…), en «Fuera de la figura». Cambiar de protocolo no
          pierde nada: lo que el nuevo no declara pasa a fuera del protocolo. BE no convierte unidades.
        </Renglon>
        <Renglon muestra={<Icono nombre="perimetro" tamano={20} />}>
          <strong>Perímetros y pliegues, de a una familia.</strong> Cada campo está unido a su sitio por una línea; tocar un sitio lleva a su campo. La cuenta de cada familia dice cuántas tienen dato. Figura de hombre o
          de mujer: es solo cómo se ve, no es un dato y no se guarda.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="pliegue" tamano={20} />}>
          <strong>Con dato o sin dato, por la forma:</strong> el anillo de un perímetro con dato tiene la mitad de adelante llena; sin dato, va entero y punteado. El punto de un pliegue con dato es un aro lleno con
          su centro; sin dato, un aro punteado y vacío. El color es siempre el mismo.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="ver" tamano={20} />}>
          <strong>Posterior:</strong> el pliegue tricipital y el subescapular se toman en la cara de atrás, y la figura está de frente. Van en gris, con la línea punteada, y el campo dice «posterior». Dos pares están a la
          misma altura y de frente casi coinciden (tricipital y bicipital; cresta ilíaca y supraespinal): sus líneas llegan casi al mismo punto.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="medido" tamano={20} />}>
          <strong>Cómo se obtuvo.</strong> {C.explicacionDeClases}
        </Renglon>
        <Renglon muestra={<Icono nombre="guardar" tamano={20} />}>
          <strong>«Cambios sin guardar»</strong> aparece cuando lo que está en pantalla no es lo guardado; si no, dice cuándo se guardó por última vez. Un campo vacío no se guarda y no es un cero. Si un valor no se
          puede leer, el aviso lo dice y lleva hasta el campo, aunque esté en la otra familia.
        </Renglon>
      </ul>
    </AyudaDeVista>
  );
}
