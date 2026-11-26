"""Checks for js/data/topic-sys-perf.js and its pack. Ids Tsys-perf-NN.
Every numeric answer is recomputed here from the question's own numbers (spec: "every numeric item needs a
recomputed answer"). Units: 1 KB = 1000 B, 1 MB = 1000 KB, 1 byte = 8 bits, unless a check says otherwise."""
import math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from assertlib import check, eq, main  # noqa: E402


def bits_for(n_symbols):
    """Fewest bits per character that give every symbol its own code."""
    return max(1, math.ceil(math.log2(n_symbols)))


def doc_bits(sentence):
    return len(sentence) * bits_for(len(set(sentence)))


def close(got, want, what, tol=1e-9):
    if abs(got - want) > tol * max(1, abs(want)):
        raise AssertionError("%s: got %r, want %r" % (what, got, want))


# ================= encoding
@check("Tsys-perf-01")
def pyq_640653771132():
    s = "sphinx of black quartz judge my vow"
    eq((len(s), len(set(s)), bits_for(len(set(s)))), (35, 27, 5), "35 characters, 27 symbols (26 letters + space), 5 bits")
    eq(doc_bits(s), 175, "175 bits")


@check("Tsys-perf-02")
def pyq_6406531021274():
    s = "the five boxing wizards jump quickly"
    eq((len(s), len(set(s)), bits_for(len(set(s)))), (36, 27, 5), "36 characters, 27 symbols, 5 bits")
    eq(doc_bits(s), 180, "180 bits")


@check("Tsys-perf-03")
def pyq_6406531325152():
    eq((bits_for(8), bits_for(8 + 5)), (3, 4), "8 symbols need 3 bits, 13 need 4")
    eq(2000 * (bits_for(13) - bits_for(8)), 2000, "one extra bit per character")


@check("Tsys-perf-04")
def bits_table():
    eq([bits_for(n) for n in (2, 3, 4, 5, 8, 9, 16, 17, 26, 27, 32, 33)], [1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 6], "ceil(log2 n)")
    eq(len(set("hello world")), 8, "repeated letters count once")


# ================= time complexity
@check("Tsys-perf-05")
def pyq_640653351999():
    n = 10 ** 8
    ta, tb = 0.001 * n, 500 * math.sqrt(n)
    eq((ta, tb), (100000.0, 5000000.0), "A 1e5 ms, B 5e6 ms")
    eq(ta < tb, True, "A is faster at 1e8")
    eq(0.001 * 10 ** 4 < 500 * math.sqrt(10 ** 4), True, "A is also faster for small n")
    close((500 / 0.001) ** 2, 2.5e11, "break-even n where 0.001n = 500 sqrt(n)")


@check("Tsys-perf-06")
def pyq_640653771134():
    ca = 420 / (10 ** 7 * math.log10(10 ** 7))
    cb = 350 / (10 ** 7) ** 2
    ta = ca * 10 ** 8 * math.log10(10 ** 8)
    tb = cb * (10 ** 8) ** 2
    close(ta, 4800, "A at 1e8: 420 x 10 x 8/7")
    close(tb, 35000, "B at 1e8: 350 x 100")
    eq(4800 in (48, 480, 48000), False, "no option has 4800 for A")


@check("Tsys-perf-07")
def scaling_rules():
    close(350 * (2 ** 2), 1400, "n^2: double n, 4x time")
    close(100 * 10 * (math.log10(10 ** 7) / math.log10(10 ** 6)), 100 * 10 * 7 / 6, "n log n: 10x n gives 10 x (log ratio)")


# ================= hardware
@check("Tsys-perf-08")
def pyq_640653690115():
    mbit_per_s = 180 * 8
    rev_per_s = mbit_per_s / 4.8
    close(rev_per_s, 300, "300 revolutions per second")
    close(rev_per_s * 60, 18000, "18000 RPM")


def dram(bus_bits, clock_hz, per_cycle=2, channels=1):
    return bus_bits / 8 * clock_hz * per_cycle * channels / 1e9


@check("Tsys-perf-09")
def pyq_640653856976():
    close(dram(64, 400e6, 2, 2), 12.8, "8 B x 400 MHz x 2 x 2 = 12.8 GB/s")


@check("Tsys-perf-10")
def pyq_6406531021272():
    close(dram(64, 800e6, 2, 2), 25.6, "8 B x 800 MHz x 2 x 2 = 25.6 GB/s")


@check("Tsys-perf-11")
def pyq_6406532035126():
    close(dram(64, 1e9, 2, 1), 16, "8 B x 1 GHz x 2 = 16 GB/s")
    close(dram(64, 1e9, 1, 1), 8, "without DDR it would be 8")


@check("Tsys-perf-12")
def pyq_6406531173007():
    close(36000 / 600, 60, "60 revolutions per second")
    close(36000 / 600 * 60, 3600, "3600 RPM")


@check("Tsys-perf-13")
def pyq_6406532180397():
    close(60 / 6000 * 1000, 10, "one full turn at 6000 rpm is 10 ms (worst case)")
    close(60 / 6000 * 1000 / 2, 5, "average rotational delay is half a turn")


@check("Tsys-perf-14")
def hierarchy_order():
    # typical figures: latency (ns), from fastest to slowest; density/capacity grows the other way
    lat = {"register": 0.3, "SRAM": 1, "DRAM": 80, "SSD": 100000, "HDD": 10000000}
    eq(sorted(lat, key=lat.get), ["register", "SRAM", "DRAM", "SSD", "HDD"], "latency order")
    eq(max(lat, key=lat.get), "HDD", "highest latency (and lowest throughput) is HDD")


# ================= latency and capacity
@check("Tsys-perf-15")
def pyq_640653690113():
    d = 3000e3
    req_ms, resp_ms = d / 2e8 * 1000, d / 3e8 * 1000
    close(req_ms, 15, "request by cable 15 ms")
    close(resp_ms, 10, "response by air 10 ms")
    close(req_ms + 30 + resp_ms, 55, "15 + 30 + 10 = 55 ms")


@check("Tsys-perf-16")
def pyq_640653856971():
    peak_viewers = 19 * 100
    close(peak_viewers * 3 / 1000, 5.7, "1900 x 3 GB = 5700 GB = 5.7 TB")


def capacity(app_pages, link_bps, bytes_per_req):
    net = link_bps / (bytes_per_req * 8)
    return net, min(app_pages, net)


@check("Tsys-perf-17")
def pyq_6406531173006():
    net, cap = capacity(100, 500e6, 500e3)
    close(net, 125, "the link carries 125 images per second")
    eq(cap, 100, "the app makes only 100 pages per second: 100")


@check("Tsys-perf-18")
def pyq_6406532035115():
    net, cap = capacity(500, 1e9, 100e3)
    close(net, 1250, "the link carries 1250 per second")
    eq(cap, 500, "the app is the bottleneck: 500")


@check("Tsys-perf-19")
def pyq_6406532035117():
    per_req = (4e3 + 6e3) * 8
    eq(5e6 / per_req, 62.5, "62.5 requests per second")
    eq(math.floor(5e6 / per_req), 62, "whole requests: 62")


@check("Tsys-perf-20")
def pyq_6406532180404():
    close(4e3 * 1.5e6 / 1e9, 6, "4 KB x 1.5 million = 6 GB")


@check("Tsys-perf-21")
def bits_vs_bytes():
    close(1e9 / 8 / 1e6, 125, "1 Gbps = 125 MB/s")
    close(500e6 / 8 / 1e6, 62.5, "500 Mbps = 62.5 MB/s")


@check("Tsys-perf-22")
def units_lesson():
    close(5e6 * 8 / 10e6, 4, "5 MB on 10 Mbps = 4 s")
    close(2e6 / (25e3 * 8), 10, "2 Mbps / 25 KB = 10 per second")
    eq((2 * 8, 3 * 10**6 * 8, 0.5 * 1000, 6000 / 60), (16, 24000000, 500.0, 100.0), "hand-trace conversions")
    eq((4 * 1000 * 8, 80 / 20), (32000, 4.0), "quiz")


@check("Tsys-perf-23")
def depth_numbers():
    eq([bits_for(n) for n in (26, 36, 62, 63, 95)], [5, 6, 6, 6, 7], "letters 5; +digits 6; both cases+digits 6; +space 6; printable ASCII 7")
    close(10 ** 9 / 10 ** 9, 1, "10^9 operations at 10^9 per second: 1 s")
    close((10 ** 5) ** 2 / 10 ** 9, 10, "n^2 with n = 10^5: 10 s")
    close(10 ** 6 * math.log2(10 ** 6) / 10 ** 9 * 1000, 19.93, "n log2 n with n = 10^6: about 20 ms", tol=1e-3)
    close(60 / 7200 / 2 * 1000, 4.1667, "average rotational delay at 7200 RPM", tol=1e-4)
    close(8 / 25.6, 0.3125, "8 GB at 25.6 GB/s")
    close(1e6 * 8 / 100e6 * 1000, 80, "1 MB over 100 Mbps: 80 ms transmission")
    close(200 * 0.05, 10, "200 requests/s that each take 50 ms: 10 in flight at once")


@check("Tsys-perf-24")
def depth_numbers_2():
    eq((1000 * 8) // 5, 1600, "characters in 1 KB (1000 B) at 5 bits each")
    close(3200e6 * 8 / 1e9, 25.6, "DDR4-3200: 3200 million transfers × 8 bytes")
    close(4 + 60 / 7200 / 2 * 1000 + 1e6 / 200e6 * 1000, 13.1667, "seek 4 ms + average rotation 4.17 ms + 1 MB at 200 MB/s (5 ms)", tol=1e-4)
    close(8 / 0.040, 200, "8 cores, 40 ms of CPU per request: 200 requests/s")
    close((3 * 500e3 * 8) / 10e6 * 1000 + 50, 1250, "three 500 KB images over 10 Mbps plus one 50 ms round trip")


if __name__ == "__main__":
    main()
