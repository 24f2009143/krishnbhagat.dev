/* sys-perf: bits per character, growth rates, memory hierarchy and disks, DRAM bandwidth, latency, server capacity.
 * Teaching prose is [ADDED]. Every number is recomputed in tests/assertions_sys-perf.py. */
APP.registerTopic("sys-perf",{
 name:"System Performance, Hardware & Encoding",
 tagline:"The arithmetic behind a web app: how many bits text needs, how running time grows, how fast disks and memory move data, and how many users a server can take.",
 story:"Every request costs something: **bits** on the wire, **time** in the code, **bytes per second** from memory and disk, and **milliseconds** travelling across the world. This topic is the back-of-the-envelope maths for those costs.\n\nThe PYQs are short calculations. Almost all of them go wrong in the same three places: mixing **bits and bytes**, forgetting a **× 60** or a **× 2**, and missing which limit is the real **bottleneck**. Each lesson gives one formula and the traps around it.",
 mindmap:{center:"Performance arithmetic",branches:[
  {t:"Encoding",kids:["distinct symbols","⌈log₂ k⌉ bits","× length"]},
  {t:"Growth",kids:["plug in n","scale by f(n₂)/f(n₁)","constants matter"]},
  {t:"Hierarchy",kids:["register → HDD","latency","density"]},
  {t:"Disks",kids:["RPM ÷ 60","bits per turn","worst = one turn"]},
  {t:"DRAM",kids:["bus ÷ 8","× clock","× 2 DDR","× channels"]},
  {t:"Network",kids:["distance ÷ speed","min of limits","size for the peak"]}]},
 connect:[["bits per character","request size","fewer bits per character, smaller pages"],["bandwidth","requests per second","link rate ÷ bits per request"],["latency","response time","each leg plus server time"],["peak load","RAM needed","capacity is sized for the busiest moment"]],
 roadmap:[["Bits for a character set","encoding"],["Running time: plug in and scale","complexity"],["Memory hierarchy and disks","hierarchy"],["DRAM bandwidth","dram"],["Propagation delay","latency"],["Server capacity","capacity"]],
 prereqs:["rf-http"],
 concepts:{
  "bit-encoding":{name:"Bits per character",sub:"bit-encoding",ease:1,repair:"With k different symbols, a fixed-length code needs ⌈log₂ k⌉ bits per symbol, so 27 symbols need 5 bits and 8 need 3. The document's size is its length (every character, spaces included) times that number. Adding symbols only changes the bits per character."},
  "growth-fit":{name:"Running time: plug in and scale",sub:"time-complexity",ease:2,repair:"To compare two formulas at a given n, substitute n and compute; constants can beat a better Big O. To predict a new time from a measured one, multiply by f(n₂)/f(n₁), because the constant cancels. For n log₁₀ n going from 10^7 to 10^8 the factor is 10 × 8/7."},
  "memory-hierarchy":{name:"Memory hierarchy",sub:"hardware-bandwidth",ease:1,repair:"From top to bottom: registers, SRAM cache, DRAM, SSD, HDD. Going down, latency rises, throughput falls and capacity (density) rises. So the HDD has the highest latency and lowest throughput, and registers hold the fewest bits."},
  "disk-rotation":{name:"Disk rotation",sub:"hardware-bandwidth",ease:2,repair:"Revolutions per second = RPM ÷ 60, and a disk delivers bits per revolution × revolutions per second. The worst-case delay before a sector arrives is one full turn, while the average is half a turn. Convert MB to Mbit (× 8) before dividing."},
  "dram-bandwidth":{name:"DRAM bandwidth",sub:"hardware-bandwidth",ease:2,repair:"Peak bandwidth = (bus width ÷ 8) bytes × clock × transfers per cycle × channels. DDR means 2 transfers per cycle and dual channel means × 2 again. A 64-bit bus is 8 bytes."},
  "propagation-delay":{name:"Propagation and processing delay",sub:"latency-capacity",ease:1,repair:"Travel time = distance ÷ signal speed, about 2 × 10^8 m/s in cable and 3 × 10^8 m/s through air. A round trip adds the request leg, any processing time and the response leg, each with its own speed."},
  "server-capacity":{name:"Server capacity",sub:"latency-capacity",ease:2,repair:"Each resource gives a limit: the app's pages per second, the link's bits per second ÷ bits per request, and memory ÷ memory per user. The server handles the smallest of these limits. Size memory for the peak load, not the average."}
 },
 sections:[
 {id:"encoding",title:"Bits for a character set",studying:"how many bits a document needs",why:"three PYQs (9 marks)",plain:"Count the different symbols, take the bits that fit them, multiply by the length.",concepts:["bit-encoding"],
  diagnostic:{id:"sp-diag-e",concept:"bit-encoding",type:"MCQ",stem:"How many bits per symbol for 27 symbols?",options:["5","4","27","6"],key:"A",diff:"easy",hints:["2^5 = 32."],explain:"5."},
  core:[
   {t:"table",title:"Symbols → bits",head:["Distinct symbols k","Bits ⌈log₂ k⌉","Why"],rows:[["2","1","2^1 = 2"],["3 to 4","2","2^2 = 4"],["5 to 8","3","2^3 = 8"],["9 to 16","4","2^4 = 16"],["17 to 32","5","2^5 = 32 (26 letters + space = 27)"],["33 to 64","6","2^6 = 64"]]},
   {t:"co",kind:"formula",text:"Size in bits = (number of characters, spaces included) × ⌈log₂(number of distinct characters)⌉. [assert:Tsys-perf-04]"},
   {t:"ex",level:"foundation",title:"hello world",problem:"\"hello world\" with a minimum fixed-length code over its own characters.",asked:"Size in bits.",idea:"Distinct symbols decide the bits; the length decides the total.",steps:["Distinct: h e l o space w r d = 8 → 3 bits.","Length: 11.","11 × 3 = 33."],answer:"33 bits [assert:Tsys-perf-04]",mistake:"Counting l and o once in the length too; the length counts every character."},
   {t:"ex",level:"exam",title:"A pangram",problem:"\"sphinx of black quartz judge my vow\", minimum encoding, nothing else saved.",asked:"Size in bits.",idea:"A pangram uses all 26 letters; add the space.",steps:["27 symbols → 5 bits.","Length 35 (29 letters, 6 spaces).","35 × 5 = 175."],answer:"175 bits [assert:Tsys-perf-01]",mistake:"Leaving out spaces (145) or using 7-bit ASCII (245)."},
   {t:"yourMove",id:"sp-move-grow",title:"Growing the character set",state:{text:"A 2000-character document uses 8 symbols. 5 more symbols are added to the set."},prompt:"By how many bits does the same document grow?",choices:["2000","10000","5","0"],key:"A",why:["Yes: 8 → 3 bits, 13 → 4 bits, so one more bit per character.","That would be 5 extra bits per character.","The growth is per character, not per symbol.","13 symbols no longer fit in 3 bits."]}
  ],
  deep:[{t:"p",text:"**Variable-length codes** (Huffman) can do better than ⌈log₂ k⌉ on average by giving common characters shorter codes. PYQs saying \"minimum encoding\" mean the fixed-length count."}],
  remember:["Bits per symbol = ⌈log₂ k⌉.","The space is a symbol.","Size = length × bits per symbol.","Adding symbols changes only the bits per symbol."],
  teachBack:{prompt:"Why does adding 5 symbols to an 8-symbol set add exactly 2000 bits to a 2000-character document?",model:"8 symbols fit in 3 bits but 13 need 4, so each of the 2000 characters needs one more bit."},
  quiz:[
   {id:"sp-e-q1",concept:"bit-encoding",type:"MCQ",stem:"Bits per symbol for 9 symbols:",options:["4","3","9","5"],key:"A",diff:"easy",hints:["8 is not enough."],explain:"4.",asserts:["Tsys-perf-04"]},
   {id:"sp-e-q2",concept:"bit-encoding",type:"NUM",stem:"\"the five boxing wizards jump quickly\" (36 characters, 27 distinct). Bits?",key:180,diff:"medium",hints:["5 bits each."],explain:"180.",asserts:["Tsys-perf-02"]},
   {id:"sp-e-q3",concept:"bit-encoding",type:"TF",stem:"Doubling the number of distinct symbols from 16 to 32 adds one bit per character.",key:"A",diff:"easy",hints:["4 → 5."],explain:"True.",asserts:["Tsys-perf-04"]}
  ]},
 {id:"complexity",title:"Running time: plug in and scale",studying:"comparing formulas at a real n and predicting new times",why:"two PYQs (7.5 marks)",plain:"Compute at the n you are given; scale by the ratio of the formulas.",concepts:["growth-fit"],
  diagnostic:{id:"sp-diag-c",concept:"growth-fit",type:"MCQ",stem:"An O(n²) job takes 1 s for n = 1000. About how long for n = 2000?",options:["4 s","2 s","1 s","8 s"],key:"A",diff:"easy",hints:["Square the ratio."],explain:"4 s."},
  core:[
   {t:"co",kind:"formula",text:"T(n₂) = T(n₁) × f(n₂) ÷ f(n₁). For f = n²: square the ratio of n. For f = n log₁₀ n from 10^7 to 10^8: × 10 × 8/7. [assert:Tsys-perf-07]"},
   {t:"ex",level:"foundation",title:"0.001n vs 500√n at 10^8",problem:"T_A = 0.001n ms, T_B = 500√n ms, n = 10^8.",asked:"Which is faster?",idea:"Plug in.",steps:["T_A = 10^5 ms.","T_B = 500 × 10^4 = 5 × 10^6 ms.","A is 50× faster."],answer:"A [assert:Tsys-perf-05]",mistake:"Choosing B because √n grows more slowly; that only wins after n = 2.5 × 10^11."},
   {t:"ex",level:"exam",title:"Scale from a test run",problem:"A: C_A n log₁₀ n, 420 ms at 10^7. B: C_B n², 350 ms at 10^7.",asked:"Times at 10^8.",idea:"Ratios cancel the constants.",steps:["A: 420 × (10^8 × 8)/(10^7 × 7) = 420 × 80/7 = 4800 ms.","B: 350 × 100 = 35000 ms."],answer:"4800 ms and 35000 ms [assert:Tsys-perf-06]",mistake:"Multiplying A by 10 only (ignoring the log) or by 100 (as if it were n²)."},
   {t:"handTrace",title:"Scale by the ratio",prompt:"Measured 100 ms at n = 10^6. Fill the time at n = 10^7 for each growth.",cols:["growth","time at 10^7 (ms)"],given:[["n","?"],["n²","?"],["√n","?"]],blanks:[[0,1],[1,1],[2,1]],key:["1000","10000","316"]},
   {t:"co",kind:"warn",text:"Big O describes very large n. A question that gives a specific n wants the numbers computed; the constant 500 in 500√n is huge."}
  ],
  deep:[{t:"p",text:"**Break-even point.** Set the two formulas equal: 0.001n = 500√n gives √n = 5 × 10^5, so n = 2.5 × 10^11. Below it A is faster, above it B. [assert:Tsys-perf-05]"}],
  remember:["Given n: compute both.","Scale: × f(n₂)/f(n₁).","n²: square the ratio; n log n: ratio × log ratio.","Constants decide below the break-even n."],
  teachBack:{prompt:"Why is the n log₁₀ n time at 10^8 not just 10 times the time at 10^7?",model:"The log part also grows, from 7 to 8, so the factor is 10 × 8/7, about 11.4."},
  quiz:[
   {id:"sp-c-q1",concept:"growth-fit",type:"NUM",stem:"O(n²): 350 ms at 10^7. ms at 10^8?",key:35000,diff:"easy",hints:["× 100."],explain:"35000.",asserts:["Tsys-perf-06"]},
   {id:"sp-c-q2",concept:"growth-fit",type:"MCQ",stem:"T_A = 0.001n, T_B = 500√n (ms). At n = 10^4, which is faster?",options:["A","B","equal","cannot tell"],key:"A",diff:"easy",hints:["10 vs 50000."],explain:"A.",asserts:["Tsys-perf-05"]},
   {id:"sp-c-q3",concept:"growth-fit",type:"TF",stem:"The algorithm with the better Big O is always faster.",key:"B",diff:"easy",hints:["Constants."],explain:"False: only beyond the break-even n."}
  ]},
 {id:"hierarchy",title:"Memory hierarchy and disks",studying:"where data lives and how fast a disk delivers it",why:"four PYQs (10 marks)",plain:"Going down the hierarchy: slower, bigger. For disks: RPM ÷ 60, bits per turn.",concepts:["memory-hierarchy","disk-rotation"],
  diagnostic:{id:"sp-diag-h",concept:"disk-rotation",type:"MCQ",stem:"6000 RPM is how many revolutions per second?",options:["100","6000","360000","10"],key:"A",diff:"easy",hints:["÷ 60."],explain:"100."},
  core:[
   {t:"table",title:"The hierarchy (typical figures)",head:["Level","Latency","Capacity","Notes"],rows:[["Register","< 1 ns","bytes","inside the CPU; lowest density"],["SRAM cache","~1 ns","MB","fast, expensive"],["DRAM","~80 ns","GB","main memory"],["SSD","~100 µs","TB","no moving parts"],["HDD","~10 ms","TB","spinning disk; highest latency, lowest throughput"]]},
   {t:"co",kind:"formula",text:"Disk throughput (bit/s) = bits per revolution × (RPM ÷ 60). Worst-case rotational delay = one revolution = 60 ÷ RPM seconds. [assert:Tsys-perf-13]"},
   {t:"ex",level:"foundation",title:"Lens speed limit",problem:"The lens reads 36,000 bit/s; 600 bits pass per revolution.",asked:"Maximum RPM.",idea:"Revolutions per second ≤ 36000 ÷ 600.",steps:["60 rev/s.","× 60 = 3600 RPM."],answer:"3600 RPM [assert:Tsys-perf-12]",mistake:"Answering 60 (per second)."},
   {t:"ex",level:"exam",title:"HDD to match an SSD",problem:"SSD: 180 MB/s. HDD reads 4.8 Mbit per revolution.",asked:"RPM needed.",idea:"Convert MB to Mbit first.",steps:["180 × 8 = 1440 Mbit/s.","1440 ÷ 4.8 = 300 rev/s.","× 60 = 18000 RPM."],answer:"18000 RPM [assert:Tsys-perf-08]",mistake:"Dividing 180 by 4.8 without converting bytes to bits."},
   {t:"player",title:"Waiting for the sector",frames:[{state:{text:"Disk at 6000 RPM: one turn every 10 ms."},caption:"100 turns per second."},{state:{text:"Best case: the sector is right under the head → 0 ms."},caption:"Lucky."},{state:{text:"Worst case: it just passed → a full turn, 10 ms."},caption:"\"Maximum delay\" = one revolution. Average = 5 ms."}]}
  ],
  deep:[{t:"p",text:"**Density** here means how many bits fit in a given amount of hardware. Registers are few and large per bit; disks pack terabytes. That is why \"lowest density\" points at registers."}],
  remember:["Register → SRAM → DRAM → SSD → HDD: slower and bigger.","HDD: highest latency, lowest throughput.","rev/s = RPM ÷ 60.","Worst delay = one turn; average = half."],
  teachBack:{prompt:"Why is the worst-case delay a full revolution on a disk that spins one way?",model:"If the sector has just passed the head, the disk must turn all the way round before it comes back."},
  quiz:[
   {id:"sp-h-q1",concept:"disk-rotation",type:"NUM",stem:"Worst-case rotational delay (ms) at 12000 RPM?",key:5,diff:"easy",hints:["200 rev/s."],explain:"5 ms.",asserts:["Tsys-perf-13"]},
   {id:"sp-h-q2",concept:"memory-hierarchy",type:"MCQ",stem:"Lowest throughput:",options:["HDD","SSD","DRAM","SRAM"],key:"A",diff:"easy",hints:["Moving parts."],explain:"HDD.",asserts:["Tsys-perf-14"]},
   {id:"sp-h-q3",concept:"disk-rotation",type:"MCQ",stem:"180 MB/s in Mbit/s:",options:["1440","22.5","180","1800"],key:"A",diff:"easy",hints:["× 8."],explain:"1440.",asserts:["Tsys-perf-08"]}
  ]},
 {id:"dram",title:"DRAM bandwidth",studying:"peak memory bandwidth from bus, clock and mode",why:"three PYQs (12 marks)",plain:"Bytes per transfer × transfers per second × channels.",concepts:["dram-bandwidth"],
  diagnostic:{id:"sp-diag-d",concept:"dram-bandwidth",type:"MCQ",stem:"A 64-bit bus moves how many bytes per transfer?",options:["8","64","16","4"],key:"A",diff:"easy",hints:["÷ 8."],explain:"8."},
  core:[
   {t:"co",kind:"formula",text:"Bandwidth (B/s) = (bus bits ÷ 8) × clock (Hz) × transfers per cycle (DDR = 2) × channels (dual = 2)."},
   {t:"flow",caption:"Build the number",W:360,H:330,nodes:[{id:"a",text:"bus 64 bits → 8 bytes",x:180,y:30,kind:"start",w:220},{id:"b",text:"× clock (e.g. 400 MHz)",x:180,y:100,w:220},{id:"c",text:"× 2 if DDR",x:180,y:170,w:200},{id:"d",text:"× 2 if dual channel",x:180,y:240,w:200},{id:"e",text:"÷ 10^9 → GB/s",x:180,y:305,kind:"end",w:180}],edges:[["a","b"],["b","c"],["c","d"],["d","e"]]},
   {t:"ex",level:"foundation",title:"1 GHz, DDR, one channel",problem:"64-bit bus, 1 GHz, DDR.",asked:"GB/s.",idea:"8 × 10^9 × 2.",steps:["8 bytes × 10^9 = 8 GB/s.","DDR × 2 = 16 GB/s.","No channel factor given."],answer:"16 GB/s [assert:Tsys-perf-11]",mistake:"Forgetting DDR (8) or adding a channel factor that is not there."},
   {t:"ex",level:"exam",title:"400 MHz vs 800 MHz, dual channel",problem:"64-bit, DDR, dual channel at 400 MHz and at 800 MHz.",asked:"GB/s for each.",idea:"Same formula; the clock doubles.",steps:["400 MHz: 8 × 400 M × 2 × 2 = 12.8.","800 MHz: 25.6."],answer:"12.8 and 25.6 GB/s [assert:Tsys-perf-09] [assert:Tsys-perf-10]",mistake:"Remembering one answer and choosing it for both versions."},
   {t:"handTrace",title:"Fill the bandwidths",prompt:"64-bit bus, DDR. Fill GB/s.",cols:["clock","channels","GB/s"],given:[["400 MHz","1","?"],["400 MHz","2","?"],["800 MHz","2","?"],["1 GHz","1","?"]],blanks:[[0,2],[1,2],[2,2],[3,2]],key:["6.4","12.8","25.6","16"]}
  ],
  deep:[{t:"p",text:"**Peak, not real.** This is the theoretical maximum; real programs reach less because of row switches, refresh and access patterns."}],
  remember:["64 bits = 8 bytes.","DDR × 2, dual channel × 2.","Use only the factors the question states.","Recompute when one number changes."],
  teachBack:{prompt:"Why does DDR double the bandwidth without changing the clock?",model:"It transfers data on both the rising and the falling edge of each clock cycle, so two transfers happen per cycle."},
  quiz:[
   {id:"sp-d-q1",concept:"dram-bandwidth",type:"NUM",stem:"64-bit, 800 MHz, DDR, single channel. GB/s?",key:12.8,diff:"easy",hints:["8 × 800 M × 2."],explain:"12.8.",asserts:["Tsys-perf-10"]},
   {id:"sp-d-q2",concept:"dram-bandwidth",type:"MCQ",stem:"Without DDR, 64-bit at 1 GHz gives:",options:["8 GB/s","16 GB/s","64 GB/s","1 GB/s"],key:"A",diff:"easy",hints:["One transfer per cycle."],explain:"8 GB/s.",asserts:["Tsys-perf-11"]},
   {id:"sp-d-q3",concept:"dram-bandwidth",type:"TF",stem:"Dual channel doubles peak bandwidth.",key:"A",diff:"easy",hints:["Two interfaces."],explain:"True."}
  ]},
 {id:"latency",title:"Propagation and processing delay",studying:"how long a request and its response take to travel",why:"one PYQ (3 marks), and the idea behind CDNs",plain:"Each leg: distance ÷ speed; then add the server's time.",concepts:["propagation-delay"],
  diagnostic:{id:"sp-diag-l",concept:"propagation-delay",type:"MCQ",stem:"3000 km by cable at 2 × 10^8 m/s takes:",options:["15 ms","10 ms","1.5 ms","150 ms"],key:"A",diff:"easy",hints:["3 × 10^6 ÷ 2 × 10^8."],explain:"15 ms."},
  core:[
   {t:"co",kind:"formula",text:"Total delay = (request distance ÷ its speed) + processing time + (response distance ÷ its speed). Cable ≈ 2 × 10^8 m/s, air ≈ 3 × 10^8 m/s."},
   {t:"ex",level:"foundation",title:"One leg",problem:"6000 km by cable.",asked:"ms.",idea:"distance ÷ speed.",steps:["6 × 10^6 ÷ 2 × 10^8 = 0.03 s."],answer:"30 ms",mistake:"Forgetting to convert km to m."},
   {t:"ex",level:"exam",title:"Cable out, air back",problem:"3000 km. Request by cable, response by air, +30 ms at the server.",asked:"Total delay.",idea:"Two speeds, one delay.",steps:["Request 15 ms.","Server 30 ms.","Response 10 ms.","Sum 55 ms."],answer:"55 ms [assert:Tsys-perf-15]",mistake:"Using the cable speed for both legs (60 ms)."},
   {t:"yourMove",id:"sp-move-cdn",title:"Move the server closer",state:{text:"Users are 3000 km away by cable (15 ms each way). A CDN copy is placed 300 km away."},prompt:"Round-trip travel time now?",choices:["3 ms","30 ms","1.5 ms","15 ms"],key:"A",why:["Yes: 1.5 ms each way.","That is the old round trip.","That is one way only.","That is one old leg."]}
  ],
  deep:[{t:"p",text:"**Propagation vs transmission.** Propagation is travel time (distance ÷ speed). Transmission is the time to push the bits onto the link (size ÷ bandwidth). PYQs here use propagation plus a fixed processing delay."}],
  remember:["Time = distance ÷ speed.","Cable 2 × 10^8 m/s, air 3 × 10^8 m/s.","Add each leg and the server delay.","Closer servers cut latency."],
  teachBack:{prompt:"Why is the answer 55 ms and not 60 ms?",model:"The response travels through air, which is faster: 10 ms instead of 15, so 15 + 30 + 10 = 55."},
  quiz:[
   {id:"sp-l-q1",concept:"propagation-delay",type:"NUM",stem:"3000 km through air at 3 × 10^8 m/s, in ms?",key:10,diff:"easy",hints:["÷."],explain:"10.",asserts:["Tsys-perf-15"]},
   {id:"sp-l-q2",concept:"propagation-delay",type:"MCQ",stem:"Request 15 ms, server 30 ms, response 15 ms. Total?",options:["60 ms","45 ms","30 ms","15 ms"],key:"A",diff:"easy",hints:["Add."],explain:"60 ms."},
   {id:"sp-l-q3",concept:"propagation-delay",type:"TF",stem:"A faster medium for the response shortens the total delay.",key:"A",diff:"easy",hints:["One leg is shorter."],explain:"True."}
  ]},
 {id:"capacity",title:"Server capacity",studying:"how many requests or users a server can handle",why:"five PYQs (15 marks)",plain:"Work out every limit; the smallest one is the answer. Size for the peak.",concepts:["server-capacity"],
  diagnostic:{id:"sp-diag-k",concept:"server-capacity",type:"MCQ",stem:"App: 100 pages/s. Network: 125 requests/s. Maximum?",options:["100","125","225","25"],key:"A",diff:"easy",hints:["Smaller limit."],explain:"100."},
  core:[
   {t:"co",kind:"formula",text:"Network limit = link (bit/s) ÷ (bytes per request × 8). Capacity = min(app limit, network limit, memory ÷ memory per user, …). [assert:Tsys-perf-21]"},
   {t:"ex",level:"foundation",title:"Header plus payload",problem:"5 Mbps line; each request 4 KB header + 6 KB payload (1 KB = 1000 B).",asked:"Requests per second.",idea:"Every byte uses the line.",steps:["10 KB × 8 = 80,000 bits.","5,000,000 ÷ 80,000 = 62.5.","Whole requests: 62."],answer:"62 [assert:Tsys-perf-19]",mistake:"Dividing 5 MB by 10 KB (500)."},
   {t:"ex",level:"exam",title:"Which limit binds?",problem:"16 cores, 64 GB, 1 Gbps. App makes 500 pages/s; each page downloads a 100 KB image.",asked:"Maximum requests per second.",idea:"Compute the network limit, compare with the app.",steps:["100 KB = 0.8 Mbit.","1000 ÷ 0.8 = 1250/s.","App: 500/s.","min = 500."],answer:"500 [assert:Tsys-perf-18]",mistake:"Answering the network figure, 1250."},
   {t:"compare",title:"Two capacity questions",cols:["","Pages question A","Pages question B"],rows:[["App limit","100/s","500/s"],["Network limit","500 Mbps ÷ 4 Mbit = 125/s","1 Gbps ÷ 0.8 Mbit = 1250/s"],["Answer","100 (app) [assert:Tsys-perf-17]","500 (app)"]]},
   {t:"yourMove",id:"sp-move-peak",title:"Size the RAM",state:{text:"Viewers over an hour peak at 1900 and average 1100. Each viewer's stream needs 3 GB of server memory."},prompt:"Minimum RAM to serve everyone at every moment?",choices:["5.7 TB","3.3 TB","5.7 GB","1.9 TB"],key:"A",why:["Yes: size for the peak, 1900 × 3 GB.","That is the average; at the peak it runs out.","The ×100 or GB→TB step is missing.","That forgets the 3 GB per viewer."]}
  ],
  deep:[{t:"p",text:"**Sessions in memory.** 1.5 million sessions × 4 KB = 6 × 10^9 B = 6 GB (decimal units). Use the units the question states; with 1024 the figure would be a little different. [assert:Tsys-perf-20]"}],
  remember:["Bits = bytes × 8.","Network limit = link ÷ bits per request.","Answer = the smallest limit.","Memory: peak users × memory per user."],
  teachBack:{prompt:"Why is the answer 100 and not 125 for the 500 Mbps server that makes 100 pages per second?",model:"The network could carry 125 images per second, but the app only produces 100 pages per second, so the app is the bottleneck."},
  quiz:[
   {id:"sp-k-q1",concept:"server-capacity",type:"NUM",stem:"1 Gbps in MB/s?",key:125,diff:"easy",hints:["÷ 8."],explain:"125.",asserts:["Tsys-perf-21"]},
   {id:"sp-k-q2",concept:"server-capacity",type:"NUM",stem:"Peak 1900 viewers × 3 GB. TB?",key:5.7,diff:"easy",hints:["5700 GB."],explain:"5.7.",asserts:["Tsys-perf-16"]},
   {id:"sp-k-q3",concept:"server-capacity",type:"MCQ",stem:"App 500/s, network 1250/s, CPU 2000/s. Capacity?",options:["500","1250","2000","3750"],key:"A",diff:"easy",hints:["min."],explain:"500.",asserts:["Tsys-perf-18"]}
  ]}
 ],
 practice:[
  {id:"sp-p1",concept:"growth-fit",type:"MCQ",stem:"An O(n) job takes 2 s for 10^6 items. Time for 5 × 10^6?",options:["10 s","2 s","50 s","25 s"],key:"A",diff:"easy",hints:["Linear."],explain:"10 s."},
  {id:"sp-p2",concept:"memory-hierarchy",type:"MCQ",stem:"Which sits between SRAM cache and SSD?",options:["DRAM","HDD","Registers","Tape"],key:"A",diff:"easy",hints:["Main memory."],explain:"DRAM.",asserts:["Tsys-perf-14"]},
  {id:"sp-p3",concept:"memory-hierarchy",type:"TF",stem:"Registers have the highest density (most bits stored) in the hierarchy.",key:"B",diff:"medium",hints:["A few bytes."],explain:"False: they hold the fewest bits."},
  {id:"sp-p4",concept:"propagation-delay",type:"NUM",stem:"9000 km by cable at 2 × 10^8 m/s. One-way delay in ms?",key:45,diff:"easy",hints:["9 × 10^6 ÷ 2 × 10^8."],explain:"45 ms."},
  {id:"sp-p5",concept:"propagation-delay",type:"MCQ",stem:"1500 km by air each way plus 20 ms at the server. Total delay?",options:["30 ms","25 ms","20 ms","40 ms"],key:"A",diff:"medium",hints:["5 ms each way."],explain:"5 + 20 + 5 = 30 ms."},
  {id:"sp-p6",concept:"server-capacity",type:"MCQ",stem:"A 100 Mbps link, 250 KB per response (decimal). Responses per second?",options:["50","400","12.5","100"],key:"A",diff:"medium",hints:["2 Mbit each."],explain:"50."}
 ],
 test:[
  {id:"sp-t1",concept:"bit-encoding",type:"MCQ",stem:"A 100-character text over 20 distinct symbols, minimum fixed-length encoding:",options:["500 bits","2000 bits","400 bits","700 bits"],key:"A",diff:"easy",hints:["5 bits."],explain:"100 × 5 = 500.",asserts:["Tsys-perf-04"]},
  {id:"sp-t2",concept:"growth-fit",type:"MCQ",stem:"O(n²): 1 s at n = 10^4. At n = 10^5?",options:["100 s","10 s","1000 s","1 s"],key:"A",diff:"easy",hints:["Ratio 10, squared."],explain:"100 s."},
  {id:"sp-t3",concept:"memory-hierarchy",type:"MCQ",stem:"Highest latency:",options:["HDD","DRAM","SRAM","Register"],key:"A",diff:"easy",hints:["Spinning."],explain:"HDD.",asserts:["Tsys-perf-14"]},
  {id:"sp-t4",concept:"disk-rotation",type:"MCQ",stem:"A disk reads 1 Mbit per revolution at 7200 RPM. Throughput?",options:["120 Mbit/s","7200 Mbit/s","60 Mbit/s","1 Mbit/s"],key:"A",diff:"medium",hints:["120 rev/s."],explain:"120 Mbit/s."},
  {id:"sp-t5",concept:"dram-bandwidth",type:"MCQ",stem:"64-bit, 400 MHz, DDR, dual channel:",options:["12.8 GB/s","25.6 GB/s","6.4 GB/s","51.2 GB/s"],key:"A",diff:"easy",hints:["8 × 400 M × 2 × 2."],explain:"12.8.",asserts:["Tsys-perf-09"]},
  {id:"sp-t6",concept:"propagation-delay",type:"MCQ",stem:"3000 km cable there, air back, 30 ms server:",options:["55 ms","60 ms","50 ms","45 ms"],key:"A",diff:"medium",hints:["15 + 30 + 10."],explain:"55 ms.",asserts:["Tsys-perf-15"]},
  {id:"sp-t7",concept:"server-capacity",type:"MCQ",stem:"5 Mbps line, 10 KB per request (decimal). Requests per second?",options:["62","500","125","31"],key:"A",diff:"medium",hints:["80 kbit each."],explain:"62.",asserts:["Tsys-perf-19"]}
 ],
 remember:{
  facts:["Bits per symbol = ⌈log₂ k⌉; size = length × bits; the space counts.","Compare at the given n; scale by f(n₂)/f(n₁).","Register → SRAM → DRAM → SSD → HDD: slower and bigger; HDD has the highest latency and lowest throughput.","Disk: rev/s = RPM ÷ 60; throughput = bits per turn × rev/s; worst delay = one turn.","DRAM: (bus ÷ 8) × clock × 2 (DDR) × channels.","Latency: distance ÷ speed per leg + processing.","Capacity: min of all limits; size memory for the peak."],
  traps:[{text:"Leaving out the space when counting symbols or length.",cause:"thinking only letters count"},{text:"Stopping at revolutions per second.",cause:"forgetting × 60"},{text:"Using 64 as bytes for a 64-bit bus.",cause:"skipping ÷ 8"},{text:"Answering the network limit when the app is slower.",cause:"checking one limit"},{text:"Using bytes where the link is in bits.",cause:"skipping × 8"},{text:"Picking an algorithm by Big O at a small n.",cause:"ignoring constants"}],
  formulas:[{tex:"b = \\lceil \\log_2 k \\rceil",means:"bits per symbol for k distinct symbols",when:"minimum fixed-length encoding"},{tex:"T(n_2) = T(n_1)\\,\\frac{f(n_2)}{f(n_1)}",means:"scale a measured time",when:"same algorithm, new n"},{tex:"BW = \\frac{w}{8}\\, f \\cdot 2 \\cdot c",means:"DRAM bytes per second",when:"bus width w, clock f, DDR, c channels"},{tex:"\\text{RPS} = \\min\\left(\\text{app}, \\frac{\\text{link}}{8 \\cdot \\text{bytes}}\\right)",means:"requests per second",when:"server capacity"}],
  examMoves:[["Bits for text","distinct (with space) → ⌈log₂⌉ → × length","45–60 s","the space"],["Scale a time","× f(n₂)/f(n₁)","60 s","log factor"],["Disk / DRAM","units first, then the formula","45–60 s","× 60, ÷ 8"],["Capacity","each limit, then min","60 s","bits vs bytes"]],
  hooks:["Bytes are fat bits: × 8 on the wire.","The slowest pipe sets the flow.","A disk's worst day is one full turn."],
  cues:[["\"minimum encoding\"","⌈log₂ distinct⌉ × length"],["\"RPM\"","÷ 60 for per second"],["\"DDR\" / \"dual channel\"","× 2 / × 2"],["\"maximum requests per second\"","min of limits"],["\"at any point of time\"","size for the peak"]],
  selector:[["encoding","count symbols, then length"],["timing","plug in, or scale by ratio"],["hardware","convert units first"],["capacity","list every limit, take the min"]]},
 methodCards:[{qType:"Bits for a sentence",recipe:"Distinct characters (space included) → ⌈log₂⌉ → × number of characters."},{qType:"Which package / new time",recipe:"Plug in n, or scale by f(n₂)/f(n₁)."},{qType:"Disk",recipe:"Bytes → bits; rev/s = RPM ÷ 60; worst delay one turn."},{qType:"DRAM",recipe:"bus ÷ 8 × clock × 2 (DDR) × channels."},{qType:"Latency",recipe:"Each leg distance ÷ speed, plus server time."},{qType:"Capacity",recipe:"Every limit in requests/s; answer the smallest; memory for the peak."}],
 flash:[
  {front:"Bits for 27 symbols",back:"5.",kind:"idea"},
  {front:"Is the space a symbol?",back:"Yes.",kind:"trap"},
  {front:"Scale a running time",back:"× f(n₂)/f(n₁).",kind:"idea"},
  {front:"Highest latency in the hierarchy",back:"HDD.",kind:"idea"},
  {front:"RPM → rev/s",back:"÷ 60.",kind:"idea"},
  {front:"Worst rotational delay",back:"One full turn.",kind:"trap"},
  {front:"DRAM bandwidth",back:"(bus/8) × clock × 2 (DDR) × channels.",kind:"idea"},
  {front:"Cable / air speed",back:"2 × 10^8 / 3 × 10^8 m/s.",kind:"idea"},
  {front:"Max requests per second",back:"min of all limits.",kind:"trap"},
  {front:"1 Gbps in MB/s",back:"125.",kind:"idea"}
 ],
 checklist:["I can count bits for a sentence or a character set.","I can compare and scale running times.","I can place storage in the hierarchy.","I can compute disk RPM, throughput and delay.","I can compute DRAM bandwidth.","I can add propagation delays and find a server's bottleneck."],
 cheat:{methods:["⌈log₂ k⌉ × length.","× f(n₂)/f(n₁).","RPM ÷ 60; (bus/8) × f × 2 × c.","min(app, link ÷ 8·bytes)."],traps:["Space is a symbol.","× 8 for bits.","× 60 for RPM.","Peak, not average."]}
});
