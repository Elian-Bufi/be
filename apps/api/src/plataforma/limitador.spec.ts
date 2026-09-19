import { redDe } from './limitador.service';

describe('redDe — clave de red del límite de intentos (DL-015)', () => {
  it('IPv4 y su forma mapeada en IPv6 son la misma red', () => {
    expect(redDe('203.0.113.7')).toBe('203.0.113.7');
    expect(redDe('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('IPv6: todas las direcciones del mismo /64 comparten cupo', () => {
    const a = redDe('2001:db8:abcd:12:1::1');
    expect(a).toBe('2001:db8:abcd:12::/64');
    expect(redDe('2001:db8:abcd:12:ffff:ffff:ffff:ffff')).toBe(a);
    expect(redDe('2001:0db8:abcd:0012::99')).toBe(a);
    expect(redDe('2001:db8:abcd:13::1')).not.toBe(a);
  });

  it('abreviaturas y extremos de IPv6', () => {
    expect(redDe('::1')).toBe('0:0:0:0::/64');
    expect(redDe('2001:db8::')).toBe('2001:db8:0:0::/64');
    expect(redDe('fe80::1%eth0')).toBe('fe80:0:0:0::/64');
  });

  it('sin dirección o con una irreconocible, una clave fija', () => {
    expect(redDe(null)).toBe('sin-ip');
    expect(redDe('no-es-una-ip')).toBe('ip-no-reconocida');
  });
});
