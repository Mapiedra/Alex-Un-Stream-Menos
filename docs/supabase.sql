-- Esquema de telemetria para "Alex: Un Stream Menos"
--
-- Pegar entero en el editor SQL de Supabase. Crea la tabla de eventos, la
-- politica que permite escribir desde el navegador, y la vista agregada que
-- alimenta el muro de finales.
--
-- QUE NO HAY AQUI: ni un solo campo que identifique a nadie. Ni IP, ni user
-- agent, ni cookie, ni identificador persistente. `sesion` se genera al cargar
-- la pagina y muere al cerrarla, asi que no enlaza dos visitas de la misma
-- persona. Es deliberado: con esto no hace falta banner de consentimiento y
-- alcanza para todo lo que se quiere medir.

create table if not exists public.eventos (
  id          bigint generated always as identity primary key,
  creado_en   timestamptz  not null default now(),
  sesion      text         not null,
  tipo        text         not null,
  minuto      integer      not null,
  semana      integer      not null,
  ciclo       integer      not null,
  detalle     jsonb,

  -- Cotas de cordura: si llega algo fuera de rango es un bug o un abuso, y en
  -- cualquiera de los dos casos no interesa guardarlo.
  constraint minuto_razonable check (minuto between 0 and 2000),
  constraint semana_razonable check (semana between 0 and 5000),
  constraint ciclo_razonable  check (ciclo  between 1 and 10),
  constraint sesion_corta     check (char_length(sesion) between 4 and 64),
  constraint tipo_conocido    check (tipo in (
    'partida_iniciada', 'ciclo_alcanzado', 'primera_compra', 'primer_formato',
    'primeras_vacaciones', 'burnout', 'evento_extraordinario',
    'partida_terminada', 'progreso'
  ))
);

create index if not exists eventos_tipo_idx   on public.eventos (tipo);
create index if not exists eventos_creado_idx on public.eventos (creado_en desc);
create index if not exists eventos_sesion_idx on public.eventos (sesion);

alter table public.eventos enable row level security;

-- El navegador SOLO puede insertar. No puede leer, ni editar, ni borrar: la
-- clave anonima va en el bundle y la ve cualquiera, asi que lo unico que se le
-- concede es escribir.
drop policy if exists "insertar eventos" on public.eventos;
create policy "insertar eventos"
  on public.eventos for insert
  to anon
  with check (true);

-- ---------------------------------------------------------------------------
-- Muro de finales
--
-- Lo unico que el navegador puede LEER, y ya agregado. Nunca se expone un
-- evento suelto.

create or replace view public.muro_finales
with (security_invoker = off) as
select
  detalle ->> 'epilogo'                          as epilogo,
  count(*)                                       as partidas,
  round(avg(semana))                             as semana_mediana,
  round(avg((detalle ->> 'vacaciones')::numeric), 1) as vacaciones_media,
  round(avg((detalle ->> 'burnouts')::numeric), 1)   as burnouts_medios
from public.eventos
where tipo = 'partida_terminada'
  and detalle ? 'epilogo'
group by 1;

grant select on public.muro_finales to anon;

-- ---------------------------------------------------------------------------
-- Consultas utiles para el playtest. No las usa el juego: son para mirar tu.

-- Donde abandona la gente. La respuesta mas valiosa de todas.
--   select minuto, count(distinct sesion) as siguen_jugando
--   from public.eventos where tipo = 'progreso'
--   group by 1 order by 1;

-- Cuantos llegan a terminar de los que empiezan.
--   select
--     count(distinct sesion) filter (where tipo = 'partida_iniciada')  as empiezan,
--     count(distinct sesion) filter (where tipo = 'partida_terminada') as terminan
--   from public.eventos;

-- En que minuto descubre la gente que descansar es buena idea. Es la
-- hipotesis H2 del protocolo de playtest, medida en lugar de preguntada.
--   select round(avg(minuto)) from public.eventos
--   where tipo = 'primeras_vacaciones';

-- Que formatos se usan de verdad y cuales no toca nadie.
--   select detalle ->> 'formato' as formato, count(*) from public.eventos
--   where tipo = 'primer_formato' group by 1 order by 2 desc;
