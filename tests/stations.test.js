import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDistanceKm,
  getNumericPrice,
  hasFuel,
  parsePrice,
} from '../src/utils/stations.js';

test('parsePrice acepta el formato de la CNE (punto decimal)', () => {
  assert.equal(parsePrice('1639.000'), 1639);
  assert.equal(parsePrice('625.000'), 625);
});

test('parsePrice no multiplica valores con coma decimal', () => {
  assert.equal(parsePrice('1299,5'), 1299.5);
  assert.equal(parsePrice('1.299,5'), 1299.5);
});

test('parsePrice interpreta varios puntos como separadores de miles', () => {
  assert.equal(parsePrice('1.299.000'), 1299000);
});

test('parsePrice acepta numeros y descarta valores invalidos', () => {
  assert.equal(parsePrice(1299), 1299);
  assert.equal(parsePrice(0), null);
  assert.equal(parsePrice(''), null);
  assert.equal(parsePrice('sin dato'), null);
  assert.equal(parsePrice(undefined), null);
});

test('getNumericPrice lee precios directos y con prefijo A', () => {
  assert.equal(getNumericPrice({ precios: { 93: { precio: '1639.000' } } }, '93'), 1639);
  assert.equal(getNumericPrice({ precios: { A95: { precio: '1699.000' } } }, '95'), 1699);
  assert.equal(getNumericPrice({ precios: {} }, '97'), null);
  assert.equal(getNumericPrice({}, '93'), null);
});

test('hasFuel distingue estaciones con y sin precio', () => {
  assert.equal(hasFuel({ precios: { DI: { precio: '1100.000' } } }, 'DI'), true);
  assert.equal(hasFuel({ precios: { DI: { precio: '1100.000' } } }, 'KE'), false);
});

test('getDistanceKm calcula una distancia plausible Santiago-Valparaiso', () => {
  const distance = getDistanceKm(-33.4489, -70.6693, -33.0472, -71.6127);
  assert.ok(distance > 95 && distance < 105, `distancia inesperada: ${distance}`);
});
