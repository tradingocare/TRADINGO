import { INDUSTRY_CATEGORIES } from '../seed-data/categories';

type Template = {
  n: string; u: string; m: number; min: number; max: number; h: string; t: string[];
};

type ProductOut = {
  name: string; unit: string; moq: number; priceRangeMin: number; priceRangeMax: number;
  hsCode: string; tags: string[];
};

const templates: Record<string, Record<string, Template[]>> = {};

function ct(cat: string, sub: string, items: Template[]) {
  if (!templates[cat]) templates[cat] = {};
  templates[cat][sub] = items;
}

// ====== Steel & Metals ======
ct('Steel & Metals', 'Carbon Steel', [
  {n:'MS Round Bar 20mm Dia', u:'Ton',m:1,min:45000,max:55000,h:'72139110',t:['ms round bar','carbon steel','20mm']},
  {n:'MS Angle 50x50x6mm', u:'Ton',m:1,min:48000,max:58000,h:'72164000',t:['ms angle','angle bar','50x50']},
  {n:'MS Channel 100x50mm ISMC', u:'Ton',m:1,min:49000,max:59000,h:'72163200',t:['ms channel','ismc','structural']},
  {n:'MS H-Beam 200x200mm', u:'Ton',m:1,min:51000,max:61000,h:'72163300',t:['h beam','steel beam']},
  {n:'TMT Bar 12mm Fe500D', u:'Ton',m:1,min:55000,max:65000,h:'72142010',t:['tmt bar','fe500d','rebar']},
  {n:'MS Square Pipe 40x40x2.5mm', u:'Ton',m:1,min:52000,max:62000,h:'73066100',t:['square pipe','ms tube']},
  {n:'MS Flat Bar 50x8mm', u:'Ton',m:1,min:47000,max:57000,h:'72159010',t:['flat bar','ms flat']},
  {n:'Carbon Steel Plate 10mm IS 2062', u:'Ton',m:1,min:52000,max:62000,h:'72085100',t:['steel plate','is 2062']},
  {n:'MS Seamless Pipe 3 Inch NB', u:'Ton',m:1,min:62000,max:75000,h:'73041910',t:['seamless pipe','cs pipe']},
  {n:'MS TMT Bar 16mm Fe550', u:'Ton',m:1,min:56000,max:66000,h:'72142010',t:['tmt 16mm','fe550']},
  {n:'MS Chequered Plate 5mm', u:'Ton',m:1,min:55000,max:65000,h:'72085100',t:['chequered plate','flooring']},
  {n:'Carbon Steel ERW Pipe 2 Inch', u:'Ton',m:1,min:54000,max:64000,h:'73063090',t:['erw pipe','welded pipe']},
  {n:'MS Hollow Section 80x40x2mm', u:'Ton',m:1,min:52000,max:62000,h:'73066100',t:['hollow section','ms']},
  {n:'MS Binding Wire 1mm', u:'Kg',m:50,min:55,max:75,h:'72172000',t:['binding wire','ms wire']},
  {n:'MS Expanded Metal 3mm', u:'Ton',m:1,min:54000,max:64000,h:'73145000',t:['expanded metal','mesh']},
  {n:'MS Square Bar 25mm', u:'Ton',m:1,min:46000,max:56000,h:'72139110',t:['square bar','ms square']},
  {n:'MS Billet 100x100mm', u:'Ton',m:10,min:42000,max:52000,h:'72071110',t:['billet','steel billet']},
  {n:'MS Rectangular Pipe 60x40mm', u:'Ton',m:1,min:53000,max:63000,h:'73066100',t:['rectangular pipe','ms']},
  {n:'MS Hex Bar 22mm', u:'Ton',m:1,min:49000,max:59000,h:'72139110',t:['ms hex','hexagonal bar']},
  {n:'MS T Section 75x75mm', u:'Ton',m:1,min:50000,max:60000,h:'72164000',t:['t section','steel tee']},
  {n:'MS Perforated Sheet 2mm', u:'Ton',m:1,min:56000,max:68000,h:'72089000',t:['perforated sheet','ms']},
  {n:'MS Weld Mesh 100x100mm', u:'Ton',m:1,min:50000,max:60000,h:'73142000',t:['weld mesh','wire mesh']},
  {n:'MS Railway Rail 52kg/m', u:'Ton',m:5,min:62000,max:75000,h:'73021010',t:['railway rail','steel rail']},
  {n:'MS Round Bar 50mm EN8', u:'Ton',m:1,min:55000,max:65000,h:'72285000',t:['en8 bar','engineering']},
  {n:'MS Bright Bar 32mm', u:'Ton',m:1,min:56000,max:66000,h:'72151000',t:['bright bar','peeled bar']},
  {n:'MS Threaded Rod M12 x 1m', u:'Piece',m:50,min:45,max:85,h:'73181500',t:['threaded rod','ms rod']},
  {n:'Carbon Steel GI Wire 2mm', u:'Ton',m:1,min:58000,max:68000,h:'72172000',t:['gi wire','galvanized']},
  {n:'MS DC Wire Rod 5.5mm', u:'Ton',m:1,min:46000,max:56000,h:'72139110',t:['wire rod','dc wire']},
  {n:'TMT Bar 10mm Fe500', u:'Ton',m:1,min:54000,max:64000,h:'72142010',t:['tmt 10mm','fe500']},
  {n:'TMT Bar 20mm Fe550D', u:'Ton',m:1,min:57000,max:67000,h:'72142010',t:['tmt 20mm','fe550d']},
  {n:'TMT Bar 25mm Fe600', u:'Ton',m:1,min:58000,max:70000,h:'72142010',t:['tmt 25mm','fe600']},
  {n:'MS Square Pipe 25x25x2mm', u:'Ton',m:1,min:52000,max:62000,h:'73066100',t:['ms square tube','25x25']},
  {n:'MS Round Pipe 1 Inch Sch 40', u:'Ton',m:1,min:53000,max:63000,h:'73063010',t:['ms pipe','schedule 40']},
  {n:'MS TMT Bar 32mm Fe500', u:'Ton',m:1,min:57000,max:68000,h:'72142010',t:['tmt 32mm','fe500']},
  {n:'MS TMT Bar 8mm Fe500', u:'Ton',m:1,min:56000,max:67000,h:'72142010',t:['tmt 8mm','fe500']},
  {n:'MS Rectangular Pipe 100x50x3mm', u:'Ton',m:1,min:53000,max:64000,h:'73066100',t:['rectangular','100x50']},
]);
ct('Steel & Metals', 'Stainless Steel', [
  {n:'SS 304 Round Bar 25mm', u:'Ton',m:1,min:185000,max:220000,h:'72222011',t:['ss 304','stainless bar']},
  {n:'SS 316 Plate 6mm', u:'Ton',m:1,min:260000,max:310000,h:'72192110',t:['ss 316','stainless plate']},
  {n:'SS 304 Pipe 2 Inch Sch 40', u:'Ton',m:1,min:210000,max:250000,h:'73064000',t:['ss pipe','304 pipe']},
  {n:'SS 202 Sheet 1.5mm', u:'Ton',m:1,min:145000,max:175000,h:'72191300',t:['ss 202','stainless sheet']},
  {n:'SS 316L Round Bar 40mm', u:'Ton',m:1,min:280000,max:340000,h:'72222019',t:['316l bar','ss round']},
  {n:'SS 304 Angle Bar 50x50mm', u:'Ton',m:1,min:200000,max:240000,h:'72224000',t:['ss angle','304 angle']},
  {n:'SS 310 Sheet 3mm', u:'Ton',m:1,min:320000,max:380000,h:'72192110',t:['ss 310','heat resistant']},
  {n:'SS 304 Wire 1.5mm', u:'Kg',m:25,min:220,max:280,h:'72230011',t:['ss wire','304 wire']},
  {n:'SS 430 Sheet 2mm BA', u:'Ton',m:1,min:120000,max:145000,h:'72191300',t:['ss 430','ferritic']},
  {n:'SS 316 Pipe 3 Inch Sch 10', u:'Ton',m:1,min:290000,max:350000,h:'73064000',t:['316 pipe','ss schedule 10']},
  {n:'SS 304 Hex Bar 20mm', u:'Ton',m:1,min:195000,max:235000,h:'72222011',t:['ss hex','304 hex']},
  {n:'SS 304 Flat Bar 40x10mm', u:'Ton',m:1,min:190000,max:230000,h:'72222011',t:['ss flat','304 flat']},
  {n:'SS 321 Sheet 4mm', u:'Ton',m:1,min:250000,max:300000,h:'72192110',t:['ss 321','titanium']},
  {n:'SS 904L Sheet 5mm', u:'Ton',m:1,min:850000,max:950000,h:'72192110',t:['904l','super austenitic']},
  {n:'SS 316L Seamless Pipe 6 Inch', u:'Ton',m:1,min:320000,max:380000,h:'73041910',t:['316l seamless','ss pipe']},
  {n:'SS 304 Coil 0.8mm 2B', u:'Ton',m:5,min:180000,max:215000,h:'72191300',t:['ss coil','304 coil']},
  {n:'SS 410 Sheet 3mm Martensitic', u:'Ton',m:1,min:160000,max:190000,h:'72192110',t:['ss 410','martensitic']},
  {n:'SS 347H Pipe High Temp', u:'Ton',m:1,min:380000,max:450000,h:'73064000',t:['347h','stainless pipe']},
  {n:'SS 304 Channel 100x50mm', u:'Ton',m:1,min:205000,max:245000,h:'72224000',t:['ss channel','304 channel']},
  {n:'SS 316Ti Round Bar', u:'Ton',m:1,min:270000,max:330000,h:'72222019',t:['316ti','titanium ss']},
  {n:'SS 304 Mirror Sheet 1mm', u:'Ton',m:1,min:210000,max:250000,h:'72191300',t:['mirror finish','no 8']},
  {n:'SS 316 Expanded Metal', u:'Ton',m:1,min:310000,max:370000,h:'73145000',t:['expanded ss','316']},
  {n:'SS 304 Butt Weld Fittings', u:'Piece',m:10,min:350,max:2500,h:'73072300',t:['ss fittings','butt weld']},
  {n:'SS 316 Flange Slip On', u:'Piece',m:5,min:800,max:5000,h:'73072100',t:['ss flange','316 flange']},
  {n:'SS 304 Fasteners M16 Hex Bolt', u:'Kg',m:10,min:280,max:350,h:'73181500',t:['ss bolt','304 fastener']},
  {n:'SS 202 Round Bar 30mm', u:'Ton',m:1,min:140000,max:170000,h:'72222011',t:['202 bar','ss 202']},
  {n:'SS 304 Sanitary Tube 1.5 Inch', u:'Meter',m:10,min:450,max:650,h:'73064000',t:['sanitary tube','ss tube']},
  {n:'SS 316L Wire 0.5mm', u:'Kg',m:5,min:350,max:450,h:'72230011',t:['316l wire','ss wire']},
  {n:'SS 304 Shim Sheet 0.1mm', u:'Kg',m:5,min:300,max:400,h:'72191200',t:['shim sheet','thin']},
  {n:'SS 409 Sheet Exhaust Grade', u:'Ton',m:1,min:130000,max:155000,h:'72191300',t:['ss 409','exhaust grade']},
  {n:'SS 304 Elbow 2 Inch', u:'Piece',m:10,min:180,max:1200,h:'73072300',t:['elbow','304 fitting']},
  {n:'SS 316 Round Bar 20mm', u:'Ton',m:1,min:275000,max:330000,h:'72222019',t:['ss 316 bar','20mm']},
  {n:'SS 304L Seamless Pipe 4 Inch', u:'Ton',m:1,min:230000,max:270000,h:'73041910',t:['304l','seamless ss']},
  {n:'SS 304 Decorative Sheet 0.6mm', u:'Ton',m:1,min:190000,max:230000,h:'72191200',t:['decorative sheet','ss']},
  {n:'SS 316L Sheet 2B 2mm', u:'Ton',m:1,min:280000,max:340000,h:'72191300',t:['316l sheet','2b finish']},
  {n:'SS 304 Perforated Sheet 2mm', u:'Ton',m:1,min:220000,max:260000,h:'72224000',t:['perforated ss','304']},
]);

ct('Steel & Metals', 'Copper', [
  {n:'Copper Sheet 1mm C11000', u:'Ton',m:1,min:720000,max:850000,h:'74091900',t:['copper sheet','c11000']},
  {n:'Copper Pipe 0.5 Inch Type L', u:'Ton',m:1,min:750000,max:880000,h:'74111000',t:['copper pipe','type l']},
  {n:'Copper Wire 2.5mm Bare', u:'Kg',m:50,min:700,max:850,h:'74081110',t:['copper wire','bare']},
  {n:'Copper Rod 20mm C101', u:'Ton',m:1,min:740000,max:870000,h:'74071010',t:['copper rod','c101']},
  {n:'Copper Tube 0.25 Inch Refrigeration', u:'Kg',m:50,min:750,max:900,h:'74111000',t:['copper tube','ac coil']},
  {n:'Copper Busbar 25x6mm', u:'Meter',m:10,min:2000,max:4000,h:'74071010',t:['busbar','copper busbar']},
  {n:'Copper Strip 50x3mm', u:'Kg',m:50,min:720,max:860,h:'74091900',t:['copper strip','busbar']},
  {n:'Copper Wire 1mm Enameled', u:'Kg',m:25,min:800,max:950,h:'74130000',t:['enameled','copper wire']},
  {n:'Copper Foil 0.1mm', u:'Kg',m:10,min:900,max:1100,h:'74101100',t:['copper foil','thin']},
  {n:'Copper Ground Rod 1m x 16mm', u:'Piece',m:25,min:800,max:1500,h:'74199900',t:['ground rod','earthing']},
  {n:'Copper Fittings Elbow 0.5 Inch', u:'Piece',m:50,min:30,max:80,h:'74121000',t:['copper elbow','fitting']},
  {n:'Copper Plate 6mm C11000', u:'Ton',m:1,min:730000,max:860000,h:'74091900',t:['copper plate','c11000']},
  {n:'Copper Braided Wire 10sqmm', u:'Meter',m:50,min:150,max:300,h:'74130000',t:['braided wire','copper']},
  {n:'Copper Lug 50sqmm Cable', u:'Piece',m:100,min:15,max:40,h:'74199900',t:['copper lug','cable lug']},
  {n:'Copper Anode Plate For Plating', u:'Ton',m:1,min:760000,max:900000,h:'74020010',t:['copper anode','plating']},
  {n:'Copper Hex Bar 25mm C101', u:'Ton',m:1,min:750000,max:880000,h:'74071010',t:['copper hex','c101']},
  {n:'Copper Flat Bar 25x5mm', u:'Ton',m:1,min:740000,max:870000,h:'74071010',t:['copper flat','busbar']},
  {n:'Copper Wire Mesh 20 Mesh', u:'Ton',m:1,min:800000,max:950000,h:'74199900',t:['copper mesh','screen']},
  {n:'Copper Welding Tip 2mm', u:'Piece',m:100,min:20,max:60,h:'74199900',t:['welding tip','copper']},
  {n:'Copper Gasket Ring 100mm', u:'Piece',m:50,min:50,max:150,h:'74152100',t:['copper gasket','seal']},
]);

// ====== Construction & Building Materials ======
ct('Construction & Building Materials', 'Cement', [
  {n:'OPC 53 Grade Cement 50kg Bag', u:'Ton',m:10,min:6500,max:7800,h:'25232100',t:['opc cement','53 grade','building']},
  {n:'PPC Cement 50kg Birla', u:'Ton',m:10,min:6200,max:7500,h:'25232900',t:['ppc cement','birla','pozzolana']},
  {n:'White Cement 40kg Bag', u:'Ton',m:5,min:12000,max:15000,h:'25232100',t:['white cement','40kg','birla']},
  {n:'PSC Cement 50kg Slag Based', u:'Ton',m:10,min:6000,max:7200,h:'25232900',t:['psc cement','slag','grade']},
  {n:'Sulphate Resistant Cement 50kg', u:'Ton',m:10,min:7000,max:8500,h:'25232900',t:['sulphate resistant','cement','src']},
  {n:'Rapid Hardening Cement 50kg', u:'Ton',m:10,min:7500,max:9000,h:'25232900',t:['rapid hardening','cement','rhc']},
  {n:'Waterproof Cement 50kg', u:'Ton',m:10,min:6800,max:8200,h:'25232900',t:['waterproof','cement','damp proof']},
  {n:'Low Heat Cement 50kg', u:'Ton',m:10,min:7200,max:8800,h:'25232900',t:['low heat cement','mass concrete']},
  {n:'Oil Well Cement Class G', u:'Ton',m:10,min:15000,max:20000,h:'25232900',t:['oil well cement','class g']},
  {n:'Masonry Cement 50kg', u:'Ton',m:10,min:5800,max:7000,h:'25232900',t:['masonry cement','mortar']},
]);
ct('Construction & Building Materials', 'Bricks & Blocks', [
  {n:'Red Clay Brick 9x4x3 Inch', u:'Piece',m:1000,min:6,max:10,h:'69041000',t:['red brick','clay brick','9x4x3']},
  {n:'Fly Ash Brick 8x4x4 Inch', u:'Piece',m:1000,min:7,max:12,h:'68101110',t:['fly ash brick','eco brick']},
  {n:'AAC Block 600x200x200mm', u:'Piece',m:100,min:55,max:85,h:'68101110',t:['aac block','autoclaved','lightweight']},
  {n:'Concrete Solid Block 400x200x200mm', u:'Piece',m:100,min:35,max:55,h:'68101110',t:['concrete block','solid','400x200']},
  {n:'Concrete Hollow Block 400x200x200mm', u:'Piece',m:100,min:28,max:45,h:'68101110',t:['hollow block','concrete','lightweight']},
  {n:'Fly Ash Block 400x200x150mm', u:'Piece',m:100,min:25,max:40,h:'68101110',t:['fly ash block','paver']},
  {n:'Clay Hollow Brick 9x4x4 Inch', u:'Piece',m:500,min:12,max:20,h:'69041000',t:['hollow brick','clay','thermal']},
  {n:'Cement Brick 12x6x4 Inch', u:'Piece',m:500,min:10,max:16,h:'68101110',t:['cement brick','solid']},
  {n:'Calcium Silicate Brick 9x4x3', u:'Piece',m:500,min:15,max:25,h:'69041000',t:['silicate brick','calcium']},
  {n:'Engineering Brick Class A', u:'Piece',m:500,min:20,max:35,h:'69041000',t:['engineering brick','class a']},
]);
ct('Construction & Building Materials', 'Aggregates & Sand', [
  {n:'River Sand Coarse Grade', u:'Ton',m:10,min:1200,max:2000,h:'25051010',t:['river sand','coarse sand','construction']},
  {n:'M Sand 4.75mm Below', u:'Ton',m:10,min:800,max:1500,h:'25059000',t:['m sand','manufactured sand','plastering']},
  {n:'Crushed Stone Aggregate 20mm', u:'Ton',m:10,min:900,max:1600,h:'25171010',t:['crushed stone','20mm aggregate','gitti']},
  {n:'Crushed Stone Aggregate 40mm', u:'Ton',m:10,min:850,max:1500,h:'25171010',t:['40mm aggregate','gitti','stone']},
  {n:'Crushed Stone Aggregate 10mm', u:'Ton',m:10,min:1000,max:1700,h:'25171010',t:['10mm aggregate','stone chips']},
  {n:'Gravel 6mm Down', u:'Ton',m:10,min:950,max:1650,h:'25171010',t:['gravel','6mm','pebble']},
  {n:'Rubble Stone 150-200mm', u:'Ton',m:10,min:600,max:1000,h:'25171010',t:['rubble','stone','foundation']},
  {n:'Plaster Sand Fine Grade', u:'Ton',m:10,min:850,max:1400,h:'25059000',t:['plaster sand','fine sand','finishing']},
  {n:'Grit Sand 2.36mm', u:'Ton',m:10,min:800,max:1300,h:'25059000',t:['grit sand','2.36mm','filter']},
  {n:'Stone Dust 0-4mm', u:'Ton',m:10,min:500,max:900,h:'25171010',t:['stone dust','quarry dust','crusher']},
]);
ct('Construction & Building Materials', 'Tiles & Flooring', [
  {n:'Ceramic Floor Tile 600x600mm Glazed', u:'Box',m:50,min:450,max:800,h:'69081010',t:['ceramic tile','600x600','floor']},
  {n:'Vitrified Tile 800x800mm Double Charge', u:'Box',m:50,min:700,max:1200,h:'69072100',t:['vitrified tile','800x800','floor']},
  {n:'Porcelain Tile 600x600mm Full Body', u:'Box',m:50,min:850,max:1500,h:'69072100',t:['porcelain tile','full body','floor']},
  {n:'Digital Wall Tile 300x600mm', u:'Box',m:50,min:350,max:650,h:'69081010',t:['wall tile','300x600','digital']},
  {n:'Mosaic Tile 300x300mm Glass', u:'Box',m:50,min:800,max:1800,h:'69081010',t:['mosaic tile','glass','decorative']},
  {n:'Kajaria Floor Tile 600x600mm', u:'Box',m:50,min:550,max:950,h:'69081010',t:['kajaria tile','600x600','floor']},
  {n:'Wooden Plank Tile 150x900mm', u:'Box',m:50,min:650,max:1200,h:'69081010',t:['wooden tile','plank','150x900']},
  {n:'Marble Look Vitrified Tile 800x800mm', u:'Box',m:50,min:900,max:1600,h:'69072100',t:['marble tile','vitrified','800x800']},
  {n:'Parking Tile 300x300mm Heavy Duty', u:'Box',m:50,min:600,max:1000,h:'69081010',t:['parking tile','heavy duty','300x300']},
  {n:'Anti Skid Tile 600x600mm Outdoor', u:'Box',m:50,min:500,max:900,h:'69081010',t:['anti skid','outdoor tile','600x600']},
]);
ct('Construction & Building Materials', 'Marble & Granite', [
  {n:'Indian Marble Slab 20mm Thick White', u:'Sq Ft',m:100,min:80,max:150,h:'68022110',t:['white marble','slab','20mm']},
  {n:'Italian Marble Slab 20mm Thick', u:'Sq Ft',m:100,min:200,max:500,h:'68022110',t:['italian marble','statuario','slab']},
  {n:'Granite Slab 18mm Thick Black', u:'Sq Ft',m:100,min:65,max:120,h:'68022310',t:['black granite','slab','18mm']},
  {n:'Granite Slab 18mm Thick Absolute Black', u:'Sq Ft',m:100,min:90,max:160,h:'68022310',t:['absolute black','granite','slab']},
  {n:'Kota Stone 20mm Thick Natural', u:'Sq Ft',m:100,min:35,max:65,h:'68022110',t:['kota stone','natural','20mm']},
  {n:'Kadappa Stone 20mm Thick', u:'Sq Ft',m:100,min:40,max:70,h:'68022110',t:['kadappa stone','black','slab']},
  {n:'Marble Tile 300x300x10mm Polished', u:'Box',m:50,min:120,max:250,h:'68022110',t:['marble tile','300x300','polished']},
  {n:'Granite Tile 300x300x10mm Flamed', u:'Box',m:50,min:100,max:200,h:'68022310',t:['granite tile','flamed','300x300']},
  {n:'Sandstone Slab 50mm Thick', u:'Sq Ft',m:100,min:45,max:80,h:'68022110',t:['sandstone','slab','50mm']},
  {n:'Slate Stone Tile 10mm Thick', u:'Sq Ft',m:100,min:55,max:95,h:'68022110',t:['slate tile','10mm','natural']},
]);
ct('Construction & Building Materials', 'Plywood & Boards', [
  {n:'Commercial Plywood 6mm MR Grade 8x4', u:'Sheet',m:50,min:800,max:1500,h:'44121000',t:['plywood','6mm','mr grade','8x4']},
  {n:'Marine Plywood 12mm BWR Grade 8x4', u:'Sheet',m:50,min:2500,max:4000,h:'44121000',t:['marine plywood','bwr','12mm']},
  {n:'MDF Board 18mm 8x4 Plain', u:'Sheet',m:50,min:1800,max:3000,h:'44111200',t:['mdf board','18mm','medium density']},
  {n:'Particle Board 16mm 8x4 Melamine', u:'Sheet',m:50,min:1200,max:2000,h:'44101110',t:['particle board','16mm','melamine']},
  {n:'WPC Board 12mm 8x4 Wood Plastic', u:'Sheet',m:50,min:3000,max:5000,h:'44092910',t:['wpc board','wood plastic','12mm']},
  {n:'Blockboard 12mm 8x4 Commercial', u:'Sheet',m:50,min:1800,max:2800,h:'44121000',t:['blockboard','12mm','8x4']},
  {n:'MR Plywood 4mm 8x4', u:'Sheet',m:100,min:500,max:900,h:'44121000',t:['mr plywood','4mm','8x4']},
  {n:'Boiling Water Proof Ply 12mm 8x4', u:'Sheet',m:50,min:2200,max:3500,h:'44121000',t:['bwp plywood','12mm','boiling']},
  {n:'Flexi Plywood 3mm 8x4', u:'Sheet',m:100,min:400,max:750,h:'44121000',t:['flexi plywood','3mm','bending']},
  {n:'Laminated MDF 18mm 8x4 Glossy White', u:'Sheet',m:50,min:2500,max:4000,h:'44111200',t:['laminate mdf','glossy','18mm']},
]);
ct('Construction & Building Materials', 'Paints & Coatings', [
  {n:'Acrylic Emulsion Paint White 20L', u:'Bucket',m:10,min:2500,max:4500,h:'32091000',t:['acrylic paint','emulsion','white']},
  {n:'Oil Based Enamel Paint 1L Red', u:'Litre',m:24,min:250,max:450,h:'32089090',t:['enamel paint','oil based','red']},
  {n:'Primer Water Based 20L White', u:'Bucket',m:10,min:2000,max:3500,h:'32091000',t:['primer','water based','20l']},
  {n:'Texture Paint 5kg Roll On', u:'Bucket',m:20,min:1200,max:2200,h:'32091000',t:['texture paint','5kg','wall']},
  {n:'Wood Polish Melamine 1L Clear', u:'Litre',m:24,min:350,max:600,h:'32091000',t:['wood polish','melamine','clear']},
  {n:'Exterior Acrylic Paint 20L Weatherproof', u:'Bucket',m:10,min:3500,max:6000,h:'32091000',t:['exterior paint','weatherproof','20l']},
  {n:'Metal Paint Red Oxide 20L', u:'Bucket',m:10,min:2800,max:4800,h:'32089090',t:['metal paint','red oxide','20l']},
  {n:'Synthetic Enamel 1L Black Gloss', u:'Litre',m:24,min:220,max:400,h:'32089090',t:['synthetic enamel','black','gloss']},
  {n:'Wall Putty 20kg Bag', u:'Bag',m:50,min:400,max:700,h:'32141000',t:['wall putty','20kg','filler']},
  {n:'Distemper Paint 20kg White', u:'Bag',m:50,min:600,max:1200,h:'32091000',t:['distemper','20kg','white']},
]);
ct('Construction & Building Materials', 'Steel & Metal Building', [
  {n:'TMT Rebar 12mm Fe550D', u:'Ton',m:1,min:55000,max:66000,h:'72142010',t:['tmt bar','fe550d','12mm']},
  {n:'GI Corrugated Sheet 0.5mm 8ft', u:'Sheet',m:50,min:450,max:700,h:'72104100',t:['gi sheet','corrugated','roofing']},
  {n:'MS Angle 50x50x6mm Building', u:'Ton',m:1,min:49000,max:59000,h:'72164000',t:['ms angle','building','50x50']},
  {n:'PPGI Roofing Sheet 0.47mm Blue', u:'Sheet',m:50,min:500,max:800,h:'72107000',t:['ppgi sheet','blue','roofing']},
  {n:'GI Plain Sheet 0.8mm 8x4', u:'Sheet',m:50,min:800,max:1300,h:'72104100',t:['gi plain sheet','8x4','0.8mm']},
  {n:'Welded Wire Mesh 150x150mm 5mm', u:'Sheet',m:50,min:500,max:900,h:'73142000',t:['wire mesh','welded','150x150']},
  {n:'GI Pipe 2 Inch Medium Building', u:'Ton',m:1,min:58000,max:70000,h:'73063090',t:['gi pipe','2 inch','building']},
  {n:'MS Square Pipe 50x50x2.5mm Building', u:'Ton',m:1,min:53000,max:64000,h:'73066100',t:['square pipe','50x50','building']},
  {n:'Chequered Plate 5mm Flooring', u:'Ton',m:1,min:56000,max:67000,h:'72085100',t:['chequered plate','flooring','5mm']},
  {n:'HR Sheet 2mm Building Grade', u:'Ton',m:1,min:51000,max:61000,h:'72082600',t:['hr sheet','2mm','building']},
]);
ct('Construction & Building Materials', 'Scaffolding & Formwork', [
  {n:'MS Scaffolding Pipe 48.3x3.2mm', u:'Ton',m:1,min:56000,max:68000,h:'73089010',t:['scaffolding pipe','ms','48mm']},
  {n:'Adjustable Steel Prop 3m Long', u:'Piece',m:50,min:800,max:1500,h:'73089010',t:['steel prop','adjustable','3m']},
  {n:'Cuplock Scaffolding System Standard', u:'Ton',m:1,min:58000,max:70000,h:'73089010',t:['cuplock','scaffolding','system']},
  {n:'H Frame Scaffolding 1.8m', u:'Set',m:25,min:2500,max:4500,h:'73089010',t:['h frame','scaffolding','1.8m']},
  {n:'Plywood Shuttering 12mm 8x4', u:'Sheet',m:50,min:1800,max:3000,h:'44121000',t:['shuttering ply','12mm','formwork']},
  {n:'Steel Shuttering Plate 600x1200mm', u:'Piece',m:50,min:1200,max:2500,h:'73089010',t:['steel shuttering','formwork','600x1200']},
  {n:'Scaffolding Clamp Swivel Type', u:'Piece',m:100,min:80,max:150,h:'73089010',t:['scaffolding clamp','swivel','pipe']},
  {n:'Scaffolding Putlog 1.5m', u:'Piece',m:50,min:300,max:600,h:'73089010',t:['putlog','scaffolding','1.5m']},
  {n:'Aluminum Formwork Panel 600mm', u:'Piece',m:50,min:3000,max:6000,h:'76109010',t:['aluminum formwork','panel','600mm']},
  {n:'Steel Scaffolding Board 2.5m', u:'Piece',m:50,min:1200,max:2200,h:'73089010',t:['scaffolding board','steel','2.5m']},
]);
ct('Construction & Building Materials', 'PVC Products', [
  {n:'PVC Pipe 1 Inch Schedule 40', u:'Meter',m:50,min:25,max:45,h:'39172310',t:['pvc pipe','1 inch','schedule 40']},
  {n:'PVC Casing Pipe 75mm Diameter', u:'Meter',m:25,min:180,max:350,h:'39172310',t:['pvc casing','75mm','borewell']},
  {n:'PVC Column Pipe 2 Inch', u:'Meter',m:25,min:150,max:300,h:'39172310',t:['pvc column','2 inch','borewell']},
  {n:'PVC SWR Pipe 110mm', u:'Meter',m:25,min:120,max:250,h:'39172310',t:['pvc swr','110mm','drain']},
  {n:'PVC Conduit Pipe 20mm', u:'Meter',m:100,min:10,max:20,h:'39172310',t:['pvc conduit','20mm','electrical']},
  {n:'PVC Door 0.8x2.1m Cellular', u:'Piece',m:10,min:2500,max:5000,h:'39252000',t:['pvc door','cellular','0.8x2.1']},
  {n:'PVC Window Frame 600x900mm', u:'Piece',m:10,min:1800,max:3500,h:'39252000',t:['pvc window','frame','600x900']},
  {n:'PVC Tank 1000 Liters Water Storage', u:'Piece',m:5,min:4000,max:7000,h:'39251000',t:['pvc tank','1000 liter','water']},
  {n:'PVC Fittings Elbow 1 Inch', u:'Piece',m:100,min:8,max:20,h:'39174000',t:['pvc elbow','1 inch','fitting']},
  {n:'PVC Solvent Cement 500ml', u:'Bottle',m:50,min:80,max:150,h:'35061000',t:['pvc solvent','cement','500ml']},
]);
ct('Construction & Building Materials', 'Glass & Glazing', [
  {n:'Clear Float Glass 4mm 5x4ft', u:'Sq Ft',m:50,min:25,max:50,h:'70052990',t:['clear glass','float','4mm']},
  {n:'Toughened Glass 12mm Tempered', u:'Sq Ft',m:50,min:65,max:120,h:'70071900',t:['toughened glass','12mm','tempered']},
  {n:'Laminated Glass 8.38mm Safety', u:'Sq Ft',m:50,min:80,max:150,h:'70072900',t:['laminated glass','8.38mm','safety']},
  {n:'Insulated Glass Unit 24mm Double Glazed', u:'Sq Ft',m:50,min:150,max:280,h:'70080010',t:['double glazed','igu','insulated']},
  {n:'Reflective Glass 6mm Coated', u:'Sq Ft',m:50,min:55,max:100,h:'70052990',t:['reflective glass','6mm','coated']},
  {n:'Frosted Glass 4mm Acid Etched', u:'Sq Ft',m:50,min:40,max:75,h:'70052990',t:['frosted glass','acid etched','4mm']},
  {n:'Mirror Glass 5mm Silvered', u:'Sq Ft',m:50,min:45,max:80,h:'70099100',t:['mirror glass','5mm','silvered']},
  {n:'Low E Glass 6mm Energy Efficient', u:'Sq Ft',m:50,min:90,max:170,h:'70052990',t:['low e glass','energy','6mm']},
  {n:'Pattern Glass 4mm Obscured', u:'Sq Ft',m:50,min:35,max:65,h:'70052990',t:['pattern glass','obscured','4mm']},
  {n:'Fire Resistant Glass 60 Minute', u:'Sq Ft',m:25,min:300,max:600,h:'70072900',t:['fire glass','60 min','safety']},
]);
ct('Construction & Building Materials', 'Hardware & Fittings', [
  {n:'MS Tower Bolt 8 Inch', u:'Piece',m:100,min:30,max:60,h:'83014900',t:['tower bolt','8 inch','ms']},
  {n:'Brass Handle 4 Inch SS Finish', u:'Piece',m:100,min:40,max:80,h:'83024200',t:['brass handle','4 inch','ss finish']},
  {n:'Stainless Steel Hinge 4x3 Inch', u:'Piece',m:100,min:25,max:55,h:'83021000',t:['ss hinge','4x3','stainless']},
  {n:'Door Lock Mortise 5 Lever', u:'Piece',m:25,min:300,max:800,h:'83014010',t:['mortise lock','5 lever','door']},
  {n:'Aluminum Sliding Lock 10mm', u:'Piece',m:100,min:50,max:100,h:'83014090',t:['sliding lock','aluminum','door']},
  {n:'Magnetic Door Catch White', u:'Piece',m:100,min:25,max:50,h:'83024200',t:['magnetic catch','door','white']},
  {n:'MS Drawer Pull Handle 128mm', u:'Piece',m:100,min:15,max:35,h:'83024200',t:['drawer pull','128mm','ms']},
  {n:'Brass Cabinet Lock 20mm', u:'Piece',m:100,min:35,max:70,h:'83014090',t:['cabinet lock','brass','20mm']},
  {n:'Door Closer Hydraulic Heavy Duty', u:'Piece',m:25,min:400,max:1000,h:'83021000',t:['door closer','hydraulic','heavy duty']},
  {n:'SS Door Stopper Floor Mount', u:'Piece',m:100,min:30,max:60,h:'83024200',t:['door stopper','floor mount','ss']},
]);
ct('Construction & Building Materials', 'Sanitaryware', [
  {n:'Wall Hung WC 550x360x330mm White', u:'Piece',m:10,min:3000,max:6000,h:'69101000',t:['wc','wall hung','white','ceramic']},
  {n:'One Piece Toilet 700x400mm', u:'Piece',m:10,min:8000,max:16000,h:'69101000',t:['one piece','toilet','700x400']},
  {n:'Wash Basin 600x450mm Oval', u:'Piece',m:10,min:2500,max:5000,h:'69101000',t:['wash basin','oval','600x450']},
  {n:'Pedestal for Wash Basin', u:'Piece',m:10,min:800,max:2000,h:'69101000',t:['pedestal','basin','ceramic']},
  {n:'Urinal 450x350x300mm White', u:'Piece',m:10,min:2000,max:4000,h:'69101000',t:['urinal','white','ceramic']},
  {n:'Cistern 10L Dual Flush', u:'Piece',m:10,min:1500,max:3500,h:'69101000',t:['cistern','10 liter','dual flush']},
  {n:'Corner Wash Basin 400x400mm', u:'Piece',m:10,min:2000,max:4500,h:'69101000',t:['corner basin','400x400','wall']},
  {n:'Kitchen Sink 900x450mm Stainless Steel', u:'Piece',m:10,min:4000,max:8000,h:'73241000',t:['kitchen sink','ss','900x450']},
  {n:'Faucet Mixer 15mm Chrome Plated', u:'Piece',m:50,min:500,max:1500,h:'84818010',t:['faucet mixer','chrome','15mm']},
  {n:'Angle Valve 15mm Chrome', u:'Piece',m:100,min:80,max:200,h:'84818010',t:['angle valve','15mm','chrome']},
]);
ct('Construction & Building Materials', 'Electrical Fittings', [
  {n:'Modular Switch 6A 1 Way', u:'Piece',m:100,min:15,max:35,h:'85365010',t:['switch','6a','1 way','modular']},
  {n:'Modular Socket 5A 3 Pin', u:'Piece',m:100,min:20,max:45,h:'85366910',t:['socket','5a','3 pin','modular']},
  {n:'MCB Single Pole 10A', u:'Piece',m:50,min:150,max:300,h:'85362010',t:['mcb','single pole','10a']},
  {n:'Distribution Board 8 Way Metal', u:'Piece',m:25,min:400,max:800,h:'85371000',t:['distribution board','8 way','metal']},
  {n:'Electric Bell 220V AC', u:'Piece',m:50,min:80,max:200,h:'85318000',t:['electric bell','220v','door']},
  {n:'Ceiling Rose 2 Terminal', u:'Piece',m:100,min:10,max:25,h:'85369010',t:['ceiling rose','terminal','holder']},
  {n:'Conduit Pipe 20mm PVC', u:'Meter',m:100,min:8,max:18,h:'39172310',t:['pvc conduit','20mm','pipe']},
  {n:'Conduit Fittings Junction Box 20mm', u:'Piece',m:100,min:10,max:25,h:'39174000',t:['junction box','20mm','conduit']},
  {n:'Earth Leakage Circuit Breaker 30mA', u:'Piece',m:25,min:800,max:1800,h:'85363000',t:['elcb','30ma','circuit breaker']},
  {n:'Changeover Switch 63A 4 Pole', u:'Piece',m:25,min:1200,max:3000,h:'85365010',t:['changeover switch','63a','4 pole']},
]);
ct('Construction & Building Materials', 'Waterproofing', [
  {n:'Bitumen Waterproofing Membrane 10m Roll', u:'Roll',m:20,min:3000,max:6000,h:'68071000',t:['bitumen membrane','waterproofing','10m']},
  {n:'Polyurethane Waterproofing Coating 20kg', u:'Bucket',m:10,min:3500,max:6000,h:'32149090',t:['pu coating','waterproof','20kg']},
  {n:'Crystalline Waterproofing Powder 5kg', u:'Bucket',m:25,min:500,max:900,h:'38244000',t:['crystalline','waterproofing','5kg']},
  {n:'Acrylic Waterproofing Coating 20L', u:'Bucket',m:10,min:3000,max:5000,h:'32149090',t:['acrylic waterproof','20l','coating']},
  {n:'Epoxy Grout 5kg Industrial', u:'Bucket',m:25,min:1500,max:3000,h:'32141000',t:['epoxy grout','5kg','waterproof']},
  {n:'Silicone Sealant 300ml Cartridge', u:'Piece',m:100,min:80,max:180,h:'32141000',t:['silicone sealant','300ml','cartridge']},
  {n:'Waterstop PVC 200mm Width', u:'Meter',m:50,min:150,max:350,h:'39269099',t:['waterstop','pvc','200mm']},
  {n:'Hydrochloric Acid 28% 20L Cleaning', u:'Bucket',m:10,min:500,max:900,h:'28061000',t:['hydrochloric acid','28%','20l']},
  {n:'Epoxy Floor Coating 10kg Gray', u:'Bucket',m:20,min:4000,max:7000,h:'32149090',t:['epoxy floor','gray','coating']},
  {n:'Joint Sealant Polysulfide 600ml', u:'Piece',m:50,min:350,max:650,h:'32141000',t:['polysulfide','sealant','600ml']},
]);

// ====== Chemicals & Petrochemicals ======
ct('Chemicals & Petrochemicals', 'Organic Chemicals', [
  {n:'Methanol 99.9% Pure 200L', u:'Drum',m:5,min:35000,max:50000,h:'29051100',t:['methanol','99.9%','200l','chemical']},
  {n:'Toluene Pure 99.5% 200L', u:'Drum',m:5,min:45000,max:65000,h:'29023000',t:['toluene','99.5%','solvent']},
  {n:'Acetone 99% 200L Industrial', u:'Drum',m:5,min:40000,max:55000,h:'29141100',t:['acetone','99%','200l']},
  {n:'Ethanol 99.9% 200L Denatured', u:'Drum',m:5,min:65000,max:90000,h:'22071000',t:['ethanol','denatured','99.9%']},
  {n:'Acetic Acid Glacial 99.8% 50kg', u:'Drum',m:10,min:30000,max:45000,h:'29152100',t:['acetic acid','glacial','99.8%']},
  {n:'Ethyl Acetate 99.5% 200L', u:'Drum',m:5,min:50000,max:70000,h:'29153100',t:['ethyl acetate','99.5%','solvent']},
  {n:'Butanol N 99% 200L', u:'Drum',m:5,min:55000,max:75000,h:'29051410',t:['n butanol','99%','200l']},
  {n:'Isopropyl Alcohol 99% 200L', u:'Drum',m:5,min:45000,max:65000,h:'29051220',t:['ipa','isopropyl','99%']},
  {n:'Formaldehyde 37% Solution 50kg', u:'Drum',m:10,min:8000,max:12000,h:'29121100',t:['formaldehyde','37%','solution']},
  {n:'Phenol Synthetic 99% 200L', u:'Drum',m:5,min:65000,max:90000,h:'29071110',t:['phenol','99%','synthetic']},
]);
ct('Chemicals & Petrochemicals', 'Inorganic Chemicals', [
  {n:'Caustic Soda Flakes 99% 50kg', u:'Bag',m:20,min:28000,max:40000,h:'28151110',t:['caustic soda','flakes','99%']},
  {n:'Soda Ash Light 99.5% 50kg', u:'Bag',m:20,min:15000,max:22000,h:'28362010',t:['soda ash','light','99.5%']},
  {n:'Sulfuric Acid 98% 200L', u:'Drum',m:5,min:8000,max:14000,h:'28070010',t:['sulfuric acid','98%','200l']},
  {n:'Hydrochloric Acid 30-33% 200L', u:'Drum',m:5,min:5000,max:9000,h:'28061000',t:['hydrochloric acid','33%','200l']},
  {n:'Sodium Bicarbonate 99% 25kg', u:'Bag',m:20,min:8000,max:12000,h:'28363000',t:['soda bicarbonate','99%','25kg']},
  {n:'Sodium Carbonate Dense 50kg', u:'Bag',m:20,min:16000,max:24000,h:'28362010',t:['soda ash dense','50kg','alkali']},
  {n:'Bleaching Powder 35% Chlorine 50kg', u:'Drum',m:10,min:10000,max:16000,h:'28281010',t:['bleaching powder','35%','50kg']},
  {n:'Alum Potash 50kg Bag', u:'Bag',m:20,min:8000,max:12000,h:'28332210',t:['alum','potash','50kg']},
  {n:'Calcium Carbonate 325 Mesh 50kg', u:'Bag',m:20,min:4000,max:7000,h:'28365000',t:['calcium carbonate','325 mesh','50kg']},
  {n:'Sodium Silicate Liquid 40BC 300kg', u:'Drum',m:5,min:15000,max:25000,h:'28391900',t:['sodium silicate','liquid','40bc']},
]);
ct('Chemicals & Petrochemicals', 'Industrial Gases', [
  {n:'Oxygen Gas 7m3 Cylinder 47L', u:'Cylinder',m:10,min:600,max:1200,h:'28044010',t:['oxygen','gas','47l','cylinder']},
  {n:'Nitrogen Gas 7m3 Cylinder 47L', u:'Cylinder',m:10,min:500,max:1000,h:'28043000',t:['nitrogen','gas','47l','cylinder']},
  {n:'Argon Gas 7m3 Cylinder 47L', u:'Cylinder',m:10,min:2000,max:4000,h:'28042100',t:['argon','gas','47l','welding']},
  {n:'Carbon Dioxide 25kg Cylinder', u:'Cylinder',m:10,min:1500,max:3000,h:'28112110',t:['carbon dioxide','25kg','cylinder']},
  {n:'Acetylene Gas 5m3 Cylinder', u:'Cylinder',m:10,min:2500,max:4500,h:'29012910',t:['acetylene','gas','5m3','welding']},
  {n:'Hydrogen Gas 7m3 Cylinder', u:'Cylinder',m:5,min:3000,max:6000,h:'28041000',t:['hydrogen','gas','7m3']},
  {n:'Helium Gas 47L Cylinder 99.995%', u:'Cylinder',m:5,min:10000,max:20000,h:'28042910',t:['helium','99.995%','gas']},
  {n:'LPG Cylinder 14.2kg Commercial', u:'Piece',m:10,min:1800,max:2500,h:'27111300',t:['lpg','14.2kg','cylinder']},
  {n:'Medical Oxygen 47L 99.5%', u:'Cylinder',m:10,min:700,max:1400,h:'28044010',t:['medical oxygen','99.5%','cylinder']},
  {n:'Compressed Air 47L 200 Bar', u:'Cylinder',m:10,min:300,max:600,h:'28041000',t:['compressed air','47l','200 bar']},
]);
ct('Chemicals & Petrochemicals', 'Specialty Chemicals', [
  {n:'Super Absorbent Polymer SAP 25kg', u:'Bag',m:10,min:12000,max:20000,h:'39069090',t:['sap','absorbent','25kg']},
  {n:'Polyaluminum Chloride PAC 30% 25kg', u:'Bag',m:20,min:6000,max:10000,h:'28273200',t:['pac','polyaluminum','30%']},
  {n:'Calcium Chloride 94% Flakes 25kg', u:'Bag',m:20,min:4000,max:7000,h:'28272000',t:['calcium chloride','94%','flakes']},
  {n:'EDTA Acid 99% 25kg', u:'Drum',m:5,min:35000,max:50000,h:'29212100',t:['edta acid','99%','25kg']},
  {n:'Citric Acid Anhydrous 99.5% 25kg', u:'Bag',m:20,min:15000,max:25000,h:'29181400',t:['citric acid','anhydrous','99.5%']},
  {n:'Zeolite 4A Powder 25kg', u:'Bag',m:20,min:8000,max:14000,h:'28421000',t:['zeolite','4a','powder']},
  {n:'Sodium Tripolyphosphate STPP 25kg', u:'Bag',m:20,min:10000,max:16000,h:'28353100',t:['stpp','sodium tripolyphosphate','25kg']},
  {n:'Hydrogen Peroxide 50% 50kg', u:'Drum',m:10,min:12000,max:20000,h:'28470000',t:['hydrogen peroxide','50%','50kg']},
  {n:'Sodium Hypochlorite 12% 50kg', u:'Drum',m:10,min:4000,max:7000,h:'28289010',t:['sodium hypochlorite','12%','50kg']},
  {n:'Potassium Permanganate 99% 50kg', u:'Drum',m:10,min:20000,max:35000,h:'28416100',t:['potassium permanganate','99%','50kg']},
]);
ct('Chemicals & Petrochemicals', 'Solvents', [
  {n:'Methylene Chloride 99.5% 250kg', u:'Drum',m:5,min:60000,max:90000,h:'29031200',t:['methylene chloride','99.5%','250kg']},
  {n:'Hexane 99% 140kg', u:'Drum',m:5,min:50000,max:75000,h:'29022000',t:['hexane','99%','140kg']},
  {n:'Xylene Mixed 99% 200L', u:'Drum',m:5,min:45000,max:65000,h:'29024400',t:['xylene','mixed','99%','200l']},
  {n:'Butyl Acetate 99% 180kg', u:'Drum',m:5,min:55000,max:80000,h:'29153300',t:['butyl acetate','99%','180kg']},
  {n:'Methyl Ethyl Ketone MEK 99% 160kg', u:'Drum',m:5,min:65000,max:95000,h:'29141200',t:['mek','methyl ethyl ketone','99%']},
  {n:'Mineral Turpentine Oil 200L', u:'Drum',m:5,min:35000,max:50000,h:'27101260',t:['turpentine','mineral','200l']},
  {n:'Diethylene Glycol DEG 99% 220kg', u:'Drum',m:5,min:50000,max:70000,h:'29094100',t:['deg','diethylene glycol','99%']},
  {n:'Propylene Glycol USP 99.5% 200kg', u:'Drum',m:5,min:70000,max:100000,h:'29053200',t:['propylene glycol','usp','99.5%']},
  {n:'Monoethylene Glycol MEG 99% 220kg', u:'Drum',m:5,min:45000,max:65000,h:'29053100',t:['meg','monoethylene glycol','99%']},
  {n:'Naphtha Solvent 200L', u:'Drum',m:5,min:25000,max:40000,h:'27101290',t:['naphtha','solvent','200l']},
]);
ct('Chemicals & Petrochemicals', 'Dyes & Pigments', [
  {n:'Titanium Dioxide Rutile 25kg', u:'Bag',m:20,min:25000,max:40000,h:'32061110',t:['titanium dioxide','rutile','25kg']},
  {n:'Carbon Black N330 20kg', u:'Bag',m:20,min:8000,max:15000,h:'28030010',t:['carbon black','n330','20kg']},
  {n:'Reactive Blue Dye 25kg', u:'Box',m:10,min:25000,max:45000,h:'32041640',t:['reactive blue','dye','25kg']},
  {n:'Direct Black Dye 25kg', u:'Box',m:10,min:15000,max:28000,h:'32041400',t:['direct black','dye','25kg']},
  {n:'Iron Oxide Red 130 25kg', u:'Bag',m:20,min:6000,max:10000,h:'28211010',t:['iron oxide red','130','25kg']},
  {n:'Ultramarine Blue Pigment 25kg', u:'Bag',m:20,min:8000,max:14000,h:'32064100',t:['ultramarine blue','pigment','25kg']},
  {n:'Disperse Yellow Dye 25kg', u:'Box',m:10,min:20000,max:35000,h:'32041100',t:['disperse yellow','dye','25kg']},
  {n:'Vat Green Dye 25kg', u:'Drum',m:10,min:30000,max:50000,h:'32041500',t:['vat green','dye','25kg']},
  {n:'Acid Red Dye 25kg', u:'Box',m:10,min:18000,max:30000,h:'32041200',t:['acid red','dye','25kg']},
  {n:'Chrome Yellow Pigment 25kg', u:'Bag',m:20,min:12000,max:20000,h:'32062000',t:['chrome yellow','pigment','25kg']},
]);
ct('Chemicals & Petrochemicals', 'Polymers & Resins', [
  {n:'Polypropylene Granules Homopolymer 25kg', u:'Bag',m:20,min:8000,max:14000,h:'39021000',t:['polypropylene','pp','homopolymer','25kg']},
  {n:'LDPE Granules 25kg Film Grade', u:'Bag',m:20,min:7500,max:13000,h:'39011010',t:['ldpe','granules','film grade','25kg']},
  {n:'HDPE Granules 25kg Injection Grade', u:'Bag',m:20,min:8000,max:14000,h:'39012000',t:['hdpe','granules','injection','25kg']},
  {n:'LLDPE Granules 25kg Rotomolding', u:'Bag',m:20,min:7000,max:12000,h:'39019000',t:['lldpe','granules','25kg']},
  {n:'PVC Resin Suspension Grade K67 25kg', u:'Bag',m:20,min:6000,max:10000,h:'39041020',t:['pvc resin','k67','suspension','25kg']},
  {n:'Polystyrene GPPS Crystal 25kg', u:'Bag',m:20,min:9000,max:15000,h:'39031110',t:['polystyrene','gpps','crystal','25kg']},
  {n:'ABS Granules 25kg Extrusion Grade', u:'Bag',m:20,min:15000,max:25000,h:'39033000',t:['abs','granules','25kg']},
  {n:'Nylon 6 Granules 25kg', u:'Bag',m:20,min:20000,max:35000,h:'39081010',t:['nylon 6','granules','25kg']},
  {n:'Polycarbonate Granules 25kg', u:'Bag',m:20,min:25000,max:40000,h:'39074000',t:['polycarbonate','granules','25kg']},
  {n:'Epoxy Resin Liquid Bisphenol A 220kg', u:'Drum',m:5,min:40000,max:65000,h:'39073010',t:['epoxy resin','bisphenol a','220kg']},
]);
ct('Chemicals & Petrochemicals', 'Petrochemicals', [
  {n:'Bitumen VG30 40kg Bag', u:'Bag',m:20,min:8000,max:12000,h:'27132000',t:['bitumen','vg30','40kg','road']},
  {n:'Furnace Oil LSHS 200L', u:'Drum',m:5,min:25000,max:35000,h:'27101940',t:['furnace oil','lshs','200l']},
  {n:'Base Oil SN150 200L Lubricant', u:'Drum',m:5,min:30000,max:45000,h:'27101980',t:['base oil','sn150','200l']},
  {n:'Wax Paraffin 56-58C 25kg', u:'Bag',m:20,min:15000,max:25000,h:'27129010',t:['paraffin wax','56-58','25kg']},
  {n:'Petroleum Jelly White 165kg', u:'Drum',m:5,min:40000,max:60000,h:'27121000',t:['petroleum jelly','white','165kg']},
  {n:'Solvent C9 Aromatic 200L', u:'Drum',m:5,min:30000,max:45000,h:'27101290',t:['c9 solvent','aromatic','200l']},
  {n:'Light Diesel Oil LDO 200L', u:'Drum',m:5,min:22000,max:32000,h:'27101930',t:['ldo','light diesel','200l']},
  {n:'Mineral Oil White 200L', u:'Drum',m:5,min:35000,max:50000,h:'27101980',t:['mineral oil','white','200l']},
  {n:'Petroleum Coke Calcined 1 Ton', u:'Ton',m:5,min:40000,max:60000,h:'27131100',t:['pet coke','calcined','ton']},
  {n:'Grease Lithium NLGI 2 15kg', u:'Bucket',m:20,min:5000,max:8000,h:'27101990',t:['lithium grease','nlgi 2','15kg']},
]);

// ====== Agriculture & Food Processing ======
ct('Agriculture & Food Processing', 'Food Grains & Cereals', [
  {n:'Basmati Rice 1121 25kg Bag', u:'Bag',m:50,min:2500,max:4500,h:'10063020',t:['basmati rice','1121','25kg']},
  {n:'Wheat Sharbati 50kg Bag', u:'Bag',m:50,min:1500,max:2500,h:'10011900',t:['wheat','sharbati','50kg']},
  {n:'Maize Corn Yellow 50kg', u:'Bag',m:50,min:1000,max:1800,h:'10059000',t:['maize','corn','yellow','50kg']},
  {n:'Milled Rice Parboiled 25kg', u:'Bag',m:50,min:1800,max:3000,h:'10063090',t:['parboiled rice','25kg','milled']},
  {n:'Pearl Millet Bajra 50kg', u:'Bag',m:50,min:1200,max:2000,h:'10082910',t:['bajra','pearl millet','50kg']},
  {n:'Sorghum Jowar 50kg Bag', u:'Bag',m:50,min:1200,max:2000,h:'10079000',t:['jowar','sorghum','50kg']},
  {n:'Barley Hulled 50kg Bag', u:'Bag',m:50,min:1500,max:2500,h:'10039000',t:['barley','hulled','50kg']},
  {n:'Oats Rolled 25kg Bag', u:'Bag',m:50,min:2000,max:3500,h:'10042000',t:['oats','rolled','25kg']},
  {n:'Finger Millet Ragi 50kg Bag', u:'Bag',m:50,min:1500,max:2800,h:'10082920',t:['ragi','finger millet','50kg']},
  {n:'Paddy Rice Raw 50kg', u:'Bag',m:50,min:1200,max:2000,h:'10061010',t:['paddy','rice','raw','50kg']},
]);
ct('Agriculture & Food Processing', 'Pulses & Legumes', [
  {n:'Toor Dal Arhar 50kg Bag', u:'Bag',m:25,min:6000,max:9000,h:'07136000',t:['toor dal','arhar','tur','50kg']},
  {n:'Moong Dal Green 50kg Bag', u:'Bag',m:25,min:7000,max:11000,h:'07133100',t:['moong dal','green gram','50kg']},
  {n:'Masoor Dal Red 50kg', u:'Bag',m:25,min:5000,max:8000,h:'07134000',t:['masoor dal','red lentil','50kg']},
  {n:'Chana Dal Bengal Gram 50kg', u:'Bag',m:25,min:4500,max:7000,h:'07132000',t:['chana dal','bengal gram','50kg']},
  {n:'Urad Dal Black Matpe 50kg', u:'Bag',m:25,min:6500,max:10000,h:'07133200',t:['urad dal','black gram','50kg']},
  {n:'Rajma Red Kidney Beans 25kg', u:'Bag',m:25,min:4000,max:6500,h:'07133300',t:['rajma','kidney beans','25kg']},
  {n:'White Peas Vatana 50kg', u:'Bag',m:25,min:3500,max:5500,h:'07131000',t:['white peas','vatana','50kg']},
  {n:'Chickpea Kabuli Chana 50kg', u:'Bag',m:25,min:5500,max:8500,h:'07132000',t:['kabuli chana','chickpea','50kg']},
  {n:'Moth Bean 50kg Bag', u:'Bag',m:25,min:3500,max:6000,h:'07133910',t:['moth bean','50kg','pulse']},
  {n:'Lobia Black Eyed Peas 25kg', u:'Bag',m:25,min:3500,max:5500,h:'07133990',t:['lobia','black eyed peas','25kg']},
]);
ct('Agriculture & Food Processing', 'Spices & Condiments', [
  {n:'Turmeric Finger 50kg Bag', u:'Bag',m:10,min:8000,max:14000,h:'09103010',t:['turmeric','finger','50kg','spice']},
  {n:'Red Chili Powder 25kg Carton', u:'Box',m:20,min:6000,max:10000,h:'09042110',t:['red chili','powder','25kg']},
  {n:'Coriander Seeds 50kg Bag', u:'Bag',m:10,min:5000,max:8000,h:'09092110',t:['coriander','seeds','50kg']},
  {n:'Cumin Seeds Jeera 25kg Bag', u:'Bag',m:10,min:14000,max:22000,h:'09093111',t:['cumin','jeera','25kg']},
  {n:'Cardamom Green 10kg Carton', u:'Box',m:5,min:150000,max:250000,h:'09083110',t:['cardamom','green','10kg']},
  {n:'Cloves 25kg Bag', u:'Bag',m:10,min:60000,max:90000,h:'09071010',t:['cloves','25kg','spice']},
  {n:'Black Pepper 50kg Bag', u:'Bag',m:10,min:40000,max:65000,h:'09041110',t:['black pepper','50kg','spice']},
  {n:'Mustard Seeds Rai 50kg Bag', u:'Bag',m:10,min:5000,max:8000,h:'12075010',t:['mustard seeds','rai','50kg']},
  {n:'Fennel Seeds Saunf 25kg', u:'Bag',m:10,min:8000,max:14000,h:'09096131',t:['fennel seeds','saunf','25kg']},
  {n:'Fenugreek Seeds Methi 25kg', u:'Bag',m:10,min:4000,max:7000,h:'09109912',t:['fenugreek','methi','25kg']},
]);
ct('Agriculture & Food Processing', 'Edible Oils & Fats', [
  {n:'Palm Oil RBD 15kg Tin', u:'Tin',m:50,min:1500,max:2500,h:'15119020',t:['palm oil','rbd','15kg']},
  {n:'Soybean Oil Refined 15kg Tin', u:'Tin',m:50,min:2000,max:3500,h:'15079010',t:['soybean oil','refined','15kg']},
  {n:'Mustard Oil Kachi Ghani 15kg Tin', u:'Tin',m:50,min:2500,max:4000,h:'15149110',t:['mustard oil','kachi ghani','15kg']},
  {n:'Sunflower Oil Refined 15kg Tin', u:'Tin',m:50,min:2000,max:3500,h:'15121110',t:['sunflower oil','refined','15kg']},
  {n:'Groundnut Oil 15kg Tin', u:'Tin',m:50,min:3000,max:5000,h:'15081000',t:['groundnut oil','15kg','cooking']},
  {n:'Coconut Oil 15kg Tin', u:'Tin',m:50,min:3500,max:5500,h:'15131100',t:['coconut oil','15kg','virgin']},
  {n:'Rice Bran Oil 15kg Tin', u:'Tin',m:50,min:2500,max:4000,h:'15159020',t:['rice bran oil','15kg','healthy']},
  {n:'Cottonseed Oil 15kg Tin', u:'Tin',m:50,min:2000,max:3500,h:'15122110',t:['cottonseed oil','15kg','refined']},
  {n:'Vegetable Ghee Vanaspati 15kg Tin', u:'Tin',m:50,min:1800,max:2800,h:'15162010',t:['vanaspati','ghee','15kg']},
  {n:'Olive Oil Extra Virgin 1L Bottle', u:'Bottle',m:12,min:500,max:1200,h:'15091000',t:['olive oil','extra virgin','1l']},
]);
ct('Agriculture & Food Processing', 'Rice & Rice Products', [
  {n:'Non Basmati Rice IR64 25kg', u:'Bag',m:50,min:1500,max:2500,h:'10063090',t:['ir64','non basmati','rice','25kg']},
  {n:'Sella Basmati Rice 1121 25kg', u:'Bag',m:50,min:3000,max:5000,h:'10063020',t:['sella basmati','1121','25kg']},
  {n:'Steam Basmati Rice 25kg', u:'Bag',m:50,min:3500,max:5500,h:'10063020',t:['steam basmati','rice','25kg']},
  {n:'Broken Rice 25kg Animal Feed', u:'Bag',m:50,min:800,max:1400,h:'10064000',t:['broken rice','feed','25kg']},
  {n:'Ponni Rice Boiled 25kg', u:'Bag',m:50,min:1800,max:3000,h:'10063090',t:['ponni rice','boiled','25kg']},
  {n:'Sona Masoori Rice 25kg', u:'Bag',m:50,min:2000,max:3500,h:'10063090',t:['sona masoori','rice','25kg']},
  {n:'Basmati Rice Pusa 1121 25kg', u:'Bag',m:50,min:2200,max:3800,h:'10063020',t:['pusa basmati','1121','25kg']},
  {n:'Idli Rice 25kg Parboiled', u:'Bag',m:50,min:1800,max:2800,h:'10063090',t:['idli rice','parboiled','25kg']},
  {n:'Raw Rice IR36 50kg Bag', u:'Bag',m:50,min:2500,max:4000,h:'10063090',t:['raw rice','ir36','50kg']},
  {n:'Matta Rice Kerala 25kg', u:'Bag',m:50,min:2200,max:3800,h:'10063090',t:['matta rice','kerala','25kg']},
]);
ct('Agriculture & Food Processing', 'Sugar & Jaggery', [
  {n:'White Sugar 50kg Bag Grade S30', u:'Bag',m:50,min:3200,max:4500,h:'17019910',t:['white sugar','s30','50kg']},
  {n:'Brown Sugar 50kg Bag', u:'Bag',m:50,min:3000,max:4200,h:'17011410',t:['brown sugar','50kg','raw']},
  {n:'Jaggery Block 10kg Box', u:'Box',m:25,min:800,max:1500,h:'17011420',t:['jaggery','gur','10kg']},
  {n:'Jaggery Powder 25kg Bag', u:'Bag',m:25,min:1200,max:2000,h:'17011420',t:['jaggery powder','gur','25kg']},
  {n:'Organic Jaggery 500g Stick', u:'Piece',m:100,min:25,max:50,h:'17011420',t:['organic jaggery','stick','500g']},
  {n:'Liquid Glucose 25kg Jar', u:'Jar',m:25,min:1500,max:2500,h:'17024000',t:['liquid glucose','25kg','jar']},
  {n:'Dextrose Monohydrate 25kg Bag', u:'Bag',m:25,min:2000,max:3500,h:'17024000',t:['dextrose','25kg','monohydrate']},
  {n:'Icing Sugar 25kg Bag', u:'Bag',m:25,min:4000,max:6500,h:'17019990',t:['icing sugar','25kg','powdered']},
  {n:'Candy Sugar Brown 10kg Box', u:'Box',m:25,min:2500,max:4500,h:'17019990',t:['candy sugar','brown','10kg']},
  {n:'Sulphurless Sugar 50kg Bag', u:'Bag',m:50,min:3500,max:5000,h:'17019910',t:['sulphurless','sugar','50kg']},
]);

// ====== Automotive & Transportation ======
ct('Automotive & Transportation', 'Auto Components', [
  {n:'Brake Shoe Assembly Hero Honda', u:'Set',m:50,min:250,max:600,h:'87083000',t:['brake shoe','hero honda','set']},
  {n:'Clutch Plate 8 Inch Organic', u:'Piece',m:25,min:800,max:2000,h:'87089300',t:['clutch plate','8 inch','organic']},
  {n:'Shock Absorber Front 800-1000kg', u:'Piece',m:25,min:1500,max:3500,h:'87088000',t:['shock absorber','front','heavy']},
  {n:'Car Brake Pad Set Ceramic', u:'Set',m:50,min:500,max:1500,h:'87083000',t:['brake pad','ceramic','car']},
  {n:'Radiator Car Aluminum 2 Row', u:'Piece',m:10,min:3000,max:8000,h:'87089100',t:['radiator','aluminum','car']},
  {n:'Alternator 12V 90A Car', u:'Piece',m:10,min:4000,max:9000,h:'85115000',t:['alternator','12v','90a']},
  {n:'Starter Motor 12V Car', u:'Piece',m:10,min:3500,max:8000,h:'85114000',t:['starter motor','12v','car']},
  {n:'Wheel Bearing Set Front', u:'Set',m:50,min:300,max:800,h:'84832000',t:['wheel bearing','front','set']},
  {n:'Timing Belt Kit Car', u:'Set',m:25,min:1000,max:3000,h:'40103911',t:['timing belt','kit','car']},
  {n:'Oil Filter Car Spin On', u:'Piece',m:50,min:80,max:250,h:'84212300',t:['oil filter','spin on','car']},
]);
ct('Automotive & Transportation', 'Engine Parts', [
  {n:'Piston Set 85mm 4 Cylinder', u:'Set',m:25,min:2000,max:5000,h:'84099111',t:['piston set','85mm','4 cylinder']},
  {n:'Engine Valve Intake 30mm', u:'Piece',m:100,min:100,max:300,h:'84099112',t:['engine valve','intake','30mm']},
  {n:'Crankshaft 4 Cylinder Petrol', u:'Piece',m:5,min:5000,max:15000,h:'84831010',t:['crankshaft','4 cyl','petrol']},
  {n:'Connecting Rod 4 Cyl Set', u:'Set',m:10,min:3000,max:8000,h:'84099113',t:['con rod','connecting rod','set']},
  {n:'Cylinder Liner 100mm Wet Type', u:'Piece',m:25,min:800,max:2500,h:'84099114',t:['cylinder liner','100mm','wet']},
  {n:'Engine Gasket Set Full', u:'Set',m:10,min:1500,max:5000,h:'84099990',t:['gasket set','engine','full']},
  {n:'Main Bearing Set Standard', u:'Set',m:25,min:600,max:2000,h:'84833000',t:['main bearing','set','standard']},
  {n:'Fuel Injector Nozzle 0.5mm', u:'Piece',m:50,min:200,max:600,h:'84099941',t:['fuel injector','nozzle','0.5mm']},
  {n:'Turbocharger Assembly 1.5L Engine', u:'Piece',m:5,min:15000,max:35000,h:'84148011',t:['turbocharger','1.5l','assembly']},
  {n:'Oil Pump Engine 2W', u:'Piece',m:25,min:300,max:900,h:'84133010',t:['oil pump','engine','2 wheeler']},
]);
ct('Automotive & Transportation', 'Tires & Tubes', [
  {n:'Car Tire 185/65 R14 Tubeless', u:'Piece',m:20,min:3000,max:6000,h:'40111010',t:['car tire','185/65 r14','tubeless']},
  {n:'Truck Tire 295/80 R20 16PR', u:'Piece',m:20,min:12000,max:20000,h:'40112010',t:['truck tire','295/80 r20','16pr']},
  {n:'Bike Tire 90/90 18 Tubeless', u:'Piece',m:20,min:1500,max:3500,h:'40114010',t:['bike tire','90/90 18','tubeless']},
  {n:'Tractor Tire 12.4x28 6PR', u:'Piece',m:10,min:8000,max:15000,h:'40117000',t:['tractor tire','12.4x28','6pr']},
  {n:'Scooter Tire 90/100 10', u:'Piece',m:20,min:800,max:2000,h:'40114010',t:['scooter tire','90/100 10','tubeless']},
  {n:'Inner Tube Truck 295/80 R20', u:'Piece',m:25,min:1500,max:3000,h:'40131010',t:['inner tube','truck','295/80']},
  {n:'Car Inner Tube 185/65 R14', u:'Piece',m:25,min:400,max:800,h:'40131010',t:['inner tube','car','14 inch']},
  {n:'Rickshaw Tire 16x3.75 4PR', u:'Piece',m:25,min:500,max:1200,h:'40112090',t:['rickshaw tire','16x3.75','4pr']},
  {n:'Solid Tire Forklift 7.00x12', u:'Piece',m:10,min:6000,max:12000,h:'40118000',t:['solid tire','forklift','7.00x12']},
  {n:'Tube Valve TR413 Rubber', u:'Piece',m:100,min:10,max:30,h:'40131010',t:['tube valve','tr413','rubber']},
]);
ct('Automotive & Transportation', 'Batteries', [
  {n:'Car Battery 12V 60Ah SMF', u:'Piece',m:10,min:3500,max:6000,h:'85071000',t:['car battery','12v','60ah','smf']},
  {n:'Inverter Battery 12V 150Ah Tall Tubular', u:'Piece',m:10,min:8000,max:15000,h:'85072000',t:['inverter battery','150ah','tall tubular']},
  {n:'Truck Battery 12V 100Ah Heavy Duty', u:'Piece',m:10,min:7000,max:12000,h:'85071000',t:['truck battery','12v','100ah']},
  {n:'Bike Battery 12V 9Ah MF', u:'Piece',m:25,min:800,max:1500,h:'85071000',t:['bike battery','12v','9ah','mf']},
  {n:'E Rickshaw Battery 100Ah 3 Piece', u:'Set',m:10,min:25000,max:40000,h:'85072000',t:['e rickshaw','battery','100ah','set']},
  {n:'Solar Battery 12V 200Ah Tubular', u:'Piece',m:5,min:12000,max:22000,h:'85072000',t:['solar battery','200ah','tubular']},
  {n:'UPS Battery 12V 7Ah SMF', u:'Piece',m:50,min:800,max:1500,h:'85072000',t:['ups battery','12v','7ah','smf']},
  {n:'Lithium Battery 12V 20Ah LiFePO4', u:'Piece',m:10,min:5000,max:10000,h:'85076000',t:['lithium battery','12v','20ah','lifepo4']},
  {n:'Golf Cart Battery 6V 225Ah', u:'Piece',m:10,min:6000,max:10000,h:'85072000',t:['golf cart','battery','6v','225ah']},
  {n:'Dry Charged Battery 12V 80Ah', u:'Piece',m:10,min:4000,max:7000,h:'85071000',t:['dry charged','battery','80ah']},
]);

// ====== Machinery & Industrial Equipment ======
ct('Machinery & Industrial Equipment', 'CNC Machines', [
  {n:'CNC Lathe Machine 2m Bed 50mm Bore', u:'Piece',m:1,min:800000,max:1800000,h:'84581100',t:['cnc lathe','2m','50mm','machine']},
  {n:'CNC Milling Machine VMC 1000x500mm', u:'Piece',m:1,min:1500000,max:3500000,h:'84595110',t:['cnc milling','vmc','1000x500']},
  {n:'CNC Plasma Cutter 1500x3000mm', u:'Piece',m:1,min:400000,max:900000,h:'84569900',t:['plasma cutter','cnc','1500x3000']},
  {n:'CNC Router 1200x2400mm 4 Axis', u:'Piece',m:1,min:300000,max:700000,h:'84595900',t:['cnc router','4 axis','1200x2400']},
  {n:'CNC Wire Cut EDM 320x250mm', u:'Piece',m:1,min:600000,max:1400000,h:'84563000',t:['wire edm','cnc','320x250']},
  {n:'CNC Surface Grinder 500x200mm', u:'Piece',m:1,min:500000,max:1200000,h:'84601100',t:['surface grinder','cnc','500x200']},
  {n:'CNC Boring Machine PBM 110mm', u:'Piece',m:1,min:2000000,max:5000000,h:'84594010',t:['cnc boring','pbm','110mm']},
  {n:'CNC Turning Center 8 Inch Chuck', u:'Piece',m:1,min:900000,max:2000000,h:'84581100',t:['turning center','cnc','8 inch']},
  {n:'CNC Laser Cutting 4kW 1500x3000mm', u:'Piece',m:1,min:2500000,max:6000000,h:'84569000',t:['laser cutting','4kw','cnc']},
  {n:'5 Axis CNC Machining Center 800x600mm', u:'Piece',m:1,min:5000000,max:12000000,h:'84595110',t:['5 axis','cnc','machining center']},
]);
ct('Machinery & Industrial Equipment', 'Welding Equipment', [
  {n:'Arc Welding Machine 300A Copper', u:'Piece',m:5,min:8000,max:18000,h:'85153100',t:['arc welder','300a','copper']},
  {n:'MIG Welding Machine 250A Gas Shielded', u:'Piece',m:5,min:25000,max:50000,h:'85153100',t:['mig welder','250a','gas']},
  {n:'TIG Welding Machine 200A AC/DC', u:'Piece',m:5,min:30000,max:60000,h:'85153900',t:['tig welder','200a','ac/dc']},
  {n:'Plasma Cutter 40A 15mm Cut', u:'Piece',m:5,min:20000,max:40000,h:'85153100',t:['plasma cutter','40a','15mm']},
  {n:'Welding Electrode 6013 3.15mm 5kg', u:'Box',m:50,min:400,max:700,h:'83111000',t:['electrode','6013','3.15mm']},
  {n:'Welding Rod E7018 4mm 5kg', u:'Box',m:50,min:500,max:900,h:'83111000',t:['welding rod','e7018','4mm']},
  {n:'CO2 Arc Welding Wire 1.2mm 15kg', u:'Spool',m:20,min:2000,max:3500,h:'83111000',t:['mig wire','co2','1.2mm']},
  {n:'Welding Helmet Auto Darkening', u:'Piece',m:25,min:1500,max:4000,h:'90049090',t:['welding helmet','auto dark','safety']},
  {n:'Welding Gloves Leather Heavy Duty', u:'Pair',m:50,min:250,max:600,h:'42032100',t:['welding gloves','leather','heavy']},
  {n:'Spot Welding Machine 10kVA', u:'Piece',m:5,min:35000,max:70000,h:'85152100',t:['spot welder','10kva','resistance']},
]);
ct('Machinery & Industrial Equipment', 'Pumps & Valves', [
  {n:'Centrifugal Pump 5HP 40mm Mono Block', u:'Piece',m:5,min:8000,max:15000,h:'84137010',t:['centrifugal pump','5hp','monoblock']},
  {n:'Submersible Pump 3HP 4 Inch Borewell', u:'Piece',m:5,min:12000,max:25000,h:'84137091',t:['submersible pump','3hp','borewell']},
  {n:'Water Pump 1HP Self Priming', u:'Piece',m:10,min:3500,max:7000,h:'84137010',t:['water pump','1hp','self priming']},
  {n:'Gate Valve Cast Iron 4 Inch 150NB', u:'Piece',m:10,min:3000,max:8000,h:'84818030',t:['gate valve','ci','4 inch']},
  {n:'Ball Valve SS 304 2 Inch Full Port', u:'Piece',m:20,min:1500,max:4000,h:'84818030',t:['ball valve','ss 304','2 inch']},
  {n:'Check Valve Swing Type 6 Inch', u:'Piece',m:10,min:4000,max:10000,h:'84818030',t:['check valve','swing','6 inch']},
  {n:'Globe Valve Cast Steel 3 Inch', u:'Piece',m:10,min:3000,max:7000,h:'84818030',t:['globe valve','cast steel','3 inch']},
  {n:'Diaphragm Valve 2 Inch SS304', u:'Piece',m:10,min:5000,max:12000,h:'84818030',t:['diaphragm valve','ss304','2 inch']},
  {n:'Butterfly Valve Wafer Type 8 Inch', u:'Piece',m:10,min:6000,max:15000,h:'84818030',t:['butterfly valve','wafer','8 inch']},
  {n:'Dosing Pump 1LPH Chemical', u:'Piece',m:5,min:8000,max:20000,h:'84135010',t:['dosing pump','1lph','chemical']},
]);
ct('Machinery & Industrial Equipment', 'Material Handling', [
  {n:'Electric Chain Hoist 1 Ton 6m Lift', u:'Piece',m:2,min:25000,max:50000,h:'84251110',t:['chain hoist','1 ton','electric','6m']},
  {n:'Manual Trolley 2 Ton Capacity', u:'Piece',m:5,min:5000,max:10000,h:'84279000',t:['manual trolley','2 ton','hand']},
  {n:'Belt Conveyor 12m Long 600mm Wide', u:'Piece',m:1,min:150000,max:300000,h:'84283300',t:['belt conveyor','12m','600mm']},
  {n:'Forklift 2.5 Ton Diesel', u:'Piece',m:1,min:500000,max:900000,h:'84272000',t:['forklift','2.5 ton','diesel']},
  {n:'Pallet Truck 2.5 Ton Hydraulic', u:'Piece',m:5,min:12000,max:25000,h:'84279000',t:['pallet truck','2.5 ton','hydraulic']},
  {n:'Crane Wire Rope 16mm Diameter 100m', u:'Roll',m:5,min:30000,max:60000,h:'73121010',t:['wire rope','16mm','crane','100m']},
  {n:'Hydraulic Cylinder 50 Ton Double Acting', u:'Piece',m:2,min:50000,max:100000,h:'84122100',t:['hydraulic cylinder','50 ton','double']},
  {n:'Weighing Scale Platform 300kg Digital', u:'Piece',m:5,min:5000,max:12000,h:'84238100',t:['weighing scale','300kg','digital']},
  {n:'Roller Conveyor 5m 400mm Wide', u:'Piece',m:1,min:60000,max:120000,h:'84283300',t:['roller conveyor','5m','400mm']},
  {n:'Stacker Hydraulic 1 Ton 3m Lift', u:'Piece',m:2,min:35000,max:70000,h:'84271000',t:['stacker','1 ton','hydraulic']},
]);
ct('Machinery & Industrial Equipment', 'Compressors', [
  {n:'Air Compressor 100 CFM Screw Type', u:'Piece',m:1,min:300000,max:500000,h:'84148011',t:['air compressor','100 cfm','screw']},
  {n:'Air Compressor 10 HP Reciprocating', u:'Piece',m:2,min:80000,max:150000,h:'84148011',t:['reciprocating compressor','10 hp','air']},
  {n:'Oil Free Air Compressor 5 HP', u:'Piece',m:2,min:50000,max:100000,h:'84148011',t:['oil free','compressor','5 hp']},
  {n:'Air Dryer Refrigerated 100 CFM', u:'Piece',m:2,min:80000,max:150000,h:'84193900',t:['air dryer','refrigerated','100 cfm']},
  {n:'Compressor 50L Tank 2HP Single Phase', u:'Piece',m:5,min:15000,max:30000,h:'84148011',t:['compressor','50l','2hp','tank']},
  {n:'Air Receiver Tank 1000L 10 Bar', u:'Piece',m:2,min:30000,max:60000,h:'73101010',t:['air receiver','tank','1000l']},
  {n:'Air Filter Regulator Lubricator FRL 1 Inch', u:'Piece',m:10,min:1500,max:3500,h:'84819090',t:['frl','air filter','1 inch']},
  {n:'Pneumatic Cylinder 100mm Bore 250mm Stroke', u:'Piece',m:10,min:2000,max:5000,h:'84123100',t:['pneumatic cylinder','100mm','250mm']},
  {n:'Solenoid Valve 5/2 24V DC', u:'Piece',m:25,min:800,max:2000,h:'84819090',t:['solenoid valve','5/2','24v dc']},
  {n:'Air Hose 10mm ID 50m PU', u:'Roll',m:10,min:3000,max:6000,h:'40093100',t:['air hose','10mm','pu','50m']},
]);

// ====== Electrical & Electronics ======
ct('Electrical & Electronics', 'Cables & Wires', [
  {n:'PVC Insulated Power Cable 1.5sqmm 100m', u:'Roll',m:10,min:1500,max:3000,h:'85444930',t:['power cable','1.5sqmm','100m','pvc']},
  {n:'Armoured Cable 3.5 Core 16sqmm 100m', u:'Roll',m:10,min:25000,max:45000,h:'85446010',t:['armoured cable','16sqmm','3.5 core']},
  {n:'Solar Cable 4sqmm DC 100m Red', u:'Roll',m:10,min:5000,max:10000,h:'85444920',t:['solar cable','4sqmm','dc','100m']},
  {n:'Submersible Cable 3x4sqmm Flat 100m', u:'Roll',m:10,min:8000,max:15000,h:'85444930',t:['submersible cable','3x4sqmm','100m']},
  {n:'Flexible Wire 0.5sqmm 90m Copper', u:'Roll',m:25,min:400,max:800,h:'85444800',t:['flexible wire','0.5sqmm','copper']},
  {n:'Welding Cable 35sqmm Copper 50m', u:'Roll',m:10,min:10000,max:20000,h:'85444930',t:['welding cable','35sqmm','50m']},
  {n:'CAT6 Ethernet Cable 100m', u:'Roll',m:10,min:3000,max:6000,h:'85444220',t:['cat6','ethernet','cable','100m']},
  {n:'Coaxial Cable RG6 100m', u:'Roll',m:10,min:2000,max:4000,h:'85442010',t:['coaxial','rg6','cable','100m']},
  {n:'HT Cable 11kV 3x120sqmm 100m', u:'Roll',m:5,min:150000,max:300000,h:'85446010',t:['ht cable','11kv','3x120sqmm','100m']},
  {n:'Telephone Cable 2 Pair 100m', u:'Roll',m:10,min:800,max:2000,h:'85444220',t:['telephone cable','2 pair','100m']},
]);
ct('Electrical & Electronics', 'Transformers', [
  {n:'Distribution Transformer 100kVA 11kV/433V', u:'Piece',m:1,min:200000,max:350000,h:'85042200',t:['transformer','100kva','11kv','distribution']},
  {n:'Power Transformer 1MVA 33kV/11kV', u:'Piece',m:1,min:1000000,max:2000000,h:'85042300',t:['power transformer','1mva','33kv']},
  {n:'CT Current Transformer 200/5A', u:'Piece',m:10,min:2000,max:5000,h:'85043100',t:['current transformer','200/5a','ct']},
  {n:'PT Potential Transformer 11kV/110V', u:'Piece',m:5,min:15000,max:30000,h:'85043100',t:['potential transformer','pt','11kv']},
  {n:'Isolation Transformer 5kVA Single Phase', u:'Piece',m:5,min:25000,max:50000,h:'85043100',t:['isolation transformer','5kva','single']},
  {n:'Auto Transformer 100A 3 Phase', u:'Piece',m:5,min:30000,max:60000,h:'85043100',t:['auto transformer','100a','3 phase']},
  {n:'Step Down Transformer 415/240V 10kVA', u:'Piece',m:5,min:20000,max:45000,h:'85043200',t:['step down','transformer','10kva']},
  {n:'Earthing Transformer 500kVA', u:'Piece',m:1,min:300000,max:600000,h:'85042300',t:['earthing transformer','500kva']},
  {n:'Furnace Transformer 2MVA', u:'Piece',m:1,min:2000000,max:4000000,h:'85042300',t:['furnace transformer','2mva']},
  {n:'Servo Voltage Stabilizer 50kVA 3 Phase', u:'Piece',m:2,min:80000,max:150000,h:'85044010',t:['servo stabilizer','50kva','3 phase']},
]);
ct('Electrical & Electronics', 'Switchgears & Panel', [
  {n:'LT Panel 400A 415V Main Distribution', u:'Piece',m:2,min:50000,max:100000,h:'85371000',t:['lt panel','400a','415v','distribution']},
  {n:'APFC Panel 50kVAR Automatic', u:'Piece',m:2,min:40000,max:80000,h:'85371000',t:['apfc panel','50kvar','automatic']},
  {n:'MCC Panel Motor Control Center 8 Way', u:'Piece',m:2,min:60000,max:120000,h:'85371000',t:['mcc panel','motor control','8 way']},
  {n:'PCC Panel Power Control 1000A', u:'Piece',m:1,min:100000,max:250000,h:'85371000',t:['pcc panel','power control','1000a']},
  {n:'DB Distribution Board 24 Way TPN', u:'Piece',m:10,min:5000,max:12000,h:'85371000',t:['db','distribution board','24 way']},
  {n:'VFD Panel 50HP Variable Frequency', u:'Piece',m:2,min:50000,max:100000,h:'85371000',t:['vfd panel','50hp','variable']},
  {n:'DG Synchronization Panel 500kVA', u:'Piece',m:1,min:200000,max:500000,h:'85371000',t:['dg sync','panel','500kva']},
  {n:'Weatherproof Panel IP65 8 Way', u:'Piece',m:10,min:8000,max:20000,h:'85371000',t:['weatherproof panel','ip65','8 way']},
  {n:'BUSBAR Trunking 1000A 3 Phase', u:'Meter',m:10,min:5000,max:10000,h:'85381010',t:['busbar trunking','1000a','phase']},
  {n:'Lightning Arrester 10kA 20kA', u:'Piece',m:10,min:5000,max:12000,h:'85354010',t:['lightning arrester','10ka','20ka']},
]);
ct('Electrical & Electronics', 'Solar Products', [
  {n:'Solar Panel 540W Mono Perc 24V', u:'Piece',m:10,min:10000,max:18000,h:'85414300',t:['solar panel','540w','mono perc']},
  {n:'Solar Inverter 3kW On Grid', u:'Piece',m:5,min:25000,max:50000,h:'85044030',t:['solar inverter','3kw','on grid']},
  {n:'Solar PCU 5kW Off Grid', u:'Piece',m:5,min:35000,max:70000,h:'85044030',t:['solar pcu','5kw','off grid']},
  {n:'Solar Battery 150Ah Tubular', u:'Piece',m:10,min:10000,max:18000,h:'85072000',t:['solar battery','150ah','tubular']},
  {n:'Solar Structure Module Mounting 5kW', u:'Set',m:5,min:8000,max:15000,h:'76109010',t:['solar structure','5kw','mounting']},
  {n:'Solar Charge Controller 60A MPPT', u:'Piece',m:10,min:5000,max:12000,h:'85044030',t:['charge controller','60a','mppt']},
  {n:'Solar Water Pump 2HP DC Surface', u:'Piece',m:5,min:35000,max:60000,h:'84137010',t:['solar pump','2hp','dc']},
  {n:'Solar Cable 6sqmm DC 100m', u:'Roll',m:10,min:6000,max:12000,h:'85444920',t:['solar cable','6sqmm','dc']},
  {n:'Solar Water Heater 200LPD FPC', u:'Piece',m:5,min:25000,max:45000,h:'84191910',t:['solar heater','200lpd','fpc']},
  {n:'Solar LED Street Light 60W All in One', u:'Piece',m:10,min:6000,max:12000,h:'94054010',t:['solar street light','60w','led']},
]);
ct('Electrical & Electronics', 'LED Lighting', [
  {n:'LED Panel Light 2x2ft 40W Cool Day', u:'Piece',m:25,min:400,max:800,h:'94051010',t:['led panel','2x2ft','40w','cool']},
  {n:'LED Bulb 9W B22 Warm White', u:'Piece',m:100,min:25,max:60,h:'85395200',t:['led bulb','9w','b22','warm']},
  {n:'LED Flood Light 50W IP65 Cool White', u:'Piece',m:25,min:800,max:2000,h:'94051010',t:['led flood light','50w','ip65']},
  {n:'LED Tube Light 4ft 20W T8', u:'Piece',m:50,min:150,max:350,h:'85395200',t:['led tube','4ft','20w','t8']},
  {n:'LED Street Light 100W IP66', u:'Piece',m:25,min:2500,max:5000,h:'94054010',t:['led street light','100w','ip66']},
  {n:'LED Downlight 6 Inch 12W', u:'Piece',m:50,min:200,max:450,h:'94051010',t:['led downlight','6 inch','12w']},
  {n:'LED Strip Light 5m 24V RGB', u:'Roll',m:25,min:500,max:1200,h:'85437099',t:['led strip','5m','rgb','24v']},
  {n:'LED High Bay 150W Industrial IP65', u:'Piece',m:10,min:3000,max:6000,h:'94054010',t:['led high bay','150w','industrial']},
  {n:'LED Emergency Light 6W 90 Mins', u:'Piece',m:25,min:400,max:900,h:'94051010',t:['emergency light','led','6w']},
  {n:'LED Batten Light 5ft 30W', u:'Piece',m:25,min:300,max:700,h:'94051010',t:['led batten','5ft','30w']},
]);

// ====== Textiles & Garments ======
ct('Textiles & Garments', 'Cotton Fabric', [
  {n:'Cotton Voile Fabric 60x60 20x20 44 Inch', u:'Meter',m:500,min:80,max:150,h:'52081110',t:['cotton voile','fabric','44 inch']},
  {n:'Cotton Poplin Fabric 40x40 110x70 58 Inch', u:'Meter',m:500,min:100,max:200,h:'52081110',t:['cotton poplin','40x40','58 inch']},
  {n:'Cotton Canvas Fabric 10oz 36 Inch', u:'Meter',m:500,min:120,max:250,h:'52081110',t:['cotton canvas','10oz','heavy']},
  {n:'Cotton Twill Fabric 20x16 128x60 58 Inch', u:'Meter',m:500,min:120,max:250,h:'52081110',t:['cotton twill','58 inch','fabric']},
  {n:'Cotton Satin Fabric 60x60 40x40 44 Inch', u:'Meter',m:500,min:150,max:300,h:'52081110',t:['cotton satin','44 inch','fabric']},
  {n:'Cotton Cheesecloth 24x20 44 Inch', u:'Meter',m:500,min:50,max:100,h:'52081110',t:['cheesecloth','cotton','44 inch']},
  {n:'Cotton Drill Fabric 16x12 44 Inch', u:'Meter',m:500,min:110,max:220,h:'52081110',t:['cotton drill','fabric','44 inch']},
  {n:'Cotton Muslin Fabric 44 Inch Soft', u:'Meter',m:500,min:70,max:140,h:'52081110',t:['cotton muslin','44 inch','soft']},
  {n:'Organic Cotton Fabric 60x60 44 Inch', u:'Meter',m:500,min:200,max:400,h:'52081110',t:['organic cotton','fabric','44 inch']},
  {n:'Cotton Denim Fabric 14oz 58 Inch Indigo', u:'Meter',m:500,min:200,max:400,h:'52094200',t:['denim fabric','14oz','indigo']},
]);
ct('Textiles & Garments', 'Silk Fabric', [
  {n:'Banarasi Silk Fabric 5.5m Saree', u:'Piece',m:25,min:1500,max:5000,h:'50072010',t:['banarasi silk','saree','fabric']},
  {n:'Kanchipuram Silk Fabric 5.5m With Border', u:'Piece',m:25,min:2000,max:8000,h:'50072010',t:['kanchipuram silk','saree','border']},
  {n:'Tussar Silk Fabric 44 Inch Natural', u:'Meter',m:100,min:400,max:1000,h:'50072010',t:['tussar silk','natural','44 inch']},
  {n:'Mulberry Silk Fabric 55g/m 44 Inch', u:'Meter',m:100,min:500,max:1200,h:'50072010',t:['mulberry silk','44 inch','55g']},
  {n:'Silk Georgette Fabric 44 Inch', u:'Meter',m:100,min:300,max:800,h:'50072010',t:['silk georgette','44 inch','fabric']},
  {n:'Silk Chiffon Fabric 60 Inch', u:'Meter',m:100,min:350,max:900,h:'50072010',t:['silk chiffon','60 inch','fabric']},
  {n:'Silk Satin Fabric 44 Inch Heavy', u:'Meter',m:100,min:300,max:700,h:'50072010',t:['silk satin','44 inch','heavy']},
  {n:'Mysore Silk Fabric 5.5m Pure', u:'Piece',m:25,min:2500,max:7000,h:'50072010',t:['mysore silk','pure','fabric']},
  {n:'Patola Silk Fabric 5.5m Double Ikat', u:'Piece',m:10,min:5000,max:15000,h:'50072010',t:['patola silk','double ikat','fabric']},
  {n:'Silk Dupatta 2.5m Embroidered', u:'Piece',m:50,min:500,max:2000,h:'50072010',t:['silk dupatta','embroidered','2.5m']},
]);
ct('Textiles & Garments', 'Synthetic Fabric', [
  {n:'Polyester Fabric 75D 44 Inch', u:'Meter',m:500,min:50,max:100,h:'54071010',t:['polyester fabric','75d','44 inch']},
  {n:'Nylon Fabric 210T 60 Inch Taffeta', u:'Meter',m:500,min:60,max:120,h:'54074200',t:['nylon taffeta','210t','60 inch']},
  {n:'Georgette Fabric Polyester 44 Inch', u:'Meter',m:500,min:60,max:120,h:'54071010',t:['georgette','polyester','44 inch']},
  {n:'Spandex Fabric 40D 60 Inch Stretch', u:'Meter',m:500,min:200,max:400,h:'54071010',t:['spandex','40d','stretch','60 inch']},
  {n:'Velvet Fabric Rayon 44 Inch', u:'Meter',m:500,min:150,max:350,h:'54071010',t:['velvet fabric','rayon','44 inch']},
  {n:'Satin Fabric Polyester 60 Inch', u:'Meter',m:500,min:60,max:120,h:'54071010',t:['satin fabric','polyester','60 inch']},
  {n:'Crepe Fabric Polyester 44 Inch', u:'Meter',m:500,min:60,max:120,h:'54071010',t:['crepe fabric','polyester','44 inch']},
  {n:'Viscose Rayon Fabric 44 Inch', u:'Meter',m:500,min:80,max:180,h:'55161110',t:['viscose rayon','44 inch','fabric']},
  {n:'Acrylic Fabric 44 Inch Sweater', u:'Meter',m:500,min:100,max:250,h:'55121910',t:['acrylic fabric','44 inch','winter']},
  {n:'Lining Fabric Polyester 44 Inch', u:'Meter',m:500,min:40,max:80,h:'54071010',t:['lining fabric','polyester','44 inch']},
]);
ct('Textiles & Garments', 'Yarns', [
  {n:'Cotton Yarn 20s Single Carded', u:'Bag',m:20,min:2000,max:3500,h:'52051110',t:['cotton yarn','20s','single','careded']},
  {n:'Cotton Yarn 40s Combed Cone', u:'Bag',m:20,min:3000,max:5000,h:'52051110',t:['cotton yarn','40s','combed','cone']},
  {n:'Polyester Yarn 150D 36F', u:'Cone',m:50,min:500,max:1000,h:'54023300',t:['polyester yarn','150d','36f']},
  {n:'Nylon Yarn 40D 24F', u:'Cone',m:50,min:400,max:800,h:'54023100',t:['nylon yarn','40d','24f']},
  {n:'Jute Yarn 2 Ply 100m', u:'Roll',m:50,min:200,max:400,h:'53071000',t:['jute yarn','2 ply','100m']},
  {n:'Wool Yarn 2.5Nm 100gm Hanks', u:'Hank',m:100,min:50,max:120,h:'51071010',t:['wool yarn','2.5nm','hank']},
  {n:'Cotton Yarn 10s Open End', u:'Bag',m:20,min:1500,max:2500,h:'52051110',t:['cotton yarn','10s','open end']},
  {n:'Sewing Thread 100m Cotton White', u:'Spool',m:200,min:10,max:30,h:'52042010',t:['sewing thread','cotton','white']},
  {n:'Elastic Yarn 70D Spandex', u:'Cone',m:50,min:500,max:1000,h:'54024400',t:['elastic yarn','70d','spandex']},
  {n:'Slub Yarn Cotton 8s', u:'Bag',m:20,min:2500,max:4000,h:'52051110',t:['slub yarn','8s','cotton']},
]);

// ====== Plastics & Polymers ======
ct('Plastics & Polymers', 'Polypropylene PP', [
  {n:'PP Granules Homopolymer 25kg', u:'Bag',m:20,min:8000,max:14000,h:'39021000',t:['pp','homopolymer','granules','25kg']},
  {n:'PP Granules Copolymer 25kg', u:'Bag',m:20,min:8500,max:15000,h:'39021000',t:['pp','copolymer','granules','25kg']},
  {n:'PP Sheet 2mm 8x4 White', u:'Sheet',m:25,min:1500,max:3000,h:'39201099',t:['pp sheet','2mm','8x4','white']},
  {n:'PP Corrugated Sheet 3mm Blue', u:'Sheet',m:50,min:100,max:250,h:'39201099',t:['pp corrugated','3mm','blue']},
  {n:'PP Hollow Sheet 4mm 8x4', u:'Sheet',m:25,min:500,max:1200,h:'39201099',t:['pp hollow','4mm','8x4']},
  {n:'PP Pipe 1 Inch Pressure', u:'Meter',m:50,min:30,max:60,h:'39172110',t:['pp pipe','1 inch','pressure']},
  {n:'PP Woven Bag 50kg Stitching', u:'Piece',m:1000,min:8,max:20,h:'39232100',t:['pp woven bag','50kg','stitching']},
  {n:'PP Fittings Elbow 1 Inch', u:'Piece',m:100,min:10,max:30,h:'39174000',t:['pp fitting','elbow','1 inch']},
  {n:'PP Strapping Band 12mm 3kg Roll', u:'Roll',m:50,min:150,max:300,h:'39219099',t:['pp strapping','12mm','3kg']},
  {n:'PP Roll Film 20 Micron 500m', u:'Roll',m:10,min:2000,max:4000,h:'39202090',t:['pp film','20 micron','500m']},
]);
ct('Plastics & Polymers', 'PVC', [
  {n:'PVC Resin Suspension K67 25kg', u:'Bag',m:20,min:6000,max:10000,h:'39041020',t:['pvc resin','k67','suspension']},
  {n:'PVC Rigid Sheet 3mm 8x4', u:'Sheet',m:25,min:2000,max:4000,h:'39204300',t:['pvc rigid','sheet','3mm','8x4']},
  {n:'PVC Flexible Sheet 1mm Clear', u:'Meter',m:50,min:200,max:500,h:'39204300',t:['pvc flexible','1mm','clear']},
  {n:'PVC Pipe Schedule 40 1 Inch 3m', u:'Piece',m:50,min:100,max:250,h:'39172310',t:['pvc pipe','sch40','1 inch']},
  {n:'PVC Garden Pipe 0.5 Inch 15m', u:'Roll',m:25,min:300,max:700,h:'39172310',t:['pvc garden pipe','0.5 inch','15m']},
  {n:'PVC Flooring Sheet 2mm 20m Roll', u:'Roll',m:10,min:8000,max:15000,h:'39181010',t:['pvc flooring','2mm','20m roll']},
  {n:'PVC Shrink Wrap 50 Micron 500m', u:'Roll',m:10,min:1500,max:3000,h:'39204300',t:['pvc shrink','50 micron','500m']},
  {n:'PVC Leather Cloth 1.2mm 50m Roll', u:'Roll',m:10,min:5000,max:10000,h:'39211200',t:['pvc leather','1.2mm','50m']},
  {n:'PVC Strip Curtain 200mm x 3mm Clear', u:'Meter',m:50,min:200,max:500,h:'39259010',t:['pvc strip curtain','200mm','clear']},
  {n:'PVC Profile 25x25mm Section T', u:'Meter',m:100,min:50,max:120,h:'39162019',t:['pvc profile','25x25','section']},
]);
ct('Plastics & Polymers', 'PET', [
  {n:'PET Preform 20g 28mm Neck 1000 Pieces', u:'Box',m:5,min:2000,max:3500,h:'39233010',t:['pet preform','20g','28mm','bottle']},
  {n:'PET Bottle 1L Round 100 Pieces', u:'Box',m:10,min:1500,max:3000,h:'39233010',t:['pet bottle','1l','round','100pcs']},
  {n:'PET Sheet 0.5mm A4 100 Sheets', u:'Pack',m:25,min:500,max:1000,h:'39206210',t:['pet sheet','0.5mm','a4','transparent']},
  {n:'PET Strap 12mm 5kg Roll Green', u:'Roll',m:25,min:250,max:500,h:'39219099',t:['pet strap','12mm','5kg','green']},
  {n:'PET Jar 500ml Round 50 Pieces', u:'Box',m:10,min:800,max:1800,h:'39233010',t:['pet jar','500ml','round','packaging']},
  {n:'PET Film 12 Micron 500m Wrap', u:'Roll',m:10,min:3000,max:6000,h:'39206210',t:['pet film','12 micron','500m']},
  {n:'PET Container 200ml Square 100 Pieces', u:'Box',m:10,min:1000,max:2500,h:'39233010',t:['pet container','200ml','square']},
  {n:'PET Bottle 2L Handle 50 Pieces', u:'Box',m:10,min:2000,max:4000,h:'39233010',t:['pet bottle','2l','handle']},
  {n:'PET Tray 100x100mm Food Grade 200 Pieces', u:'Box',m:10,min:1500,max:3000,h:'39231010',t:['pet tray','100x100','food grade']},
  {n:'PET Beads Crystallized 25kg', u:'Bag',m:20,min:10000,max:18000,h:'39076910',t:['pet beads','crystallized','25kg']},
]);
ct('Plastics & Polymers', 'Plastic Sheets', [
  {n:'Acrylic Sheet 3mm 8x4 Clear', u:'Sheet',m:25,min:2500,max:5000,h:'39205110',t:['acrylic sheet','3mm','8x4','clear']},
  {n:'Polycarbonate Sheet 6mm 8x4 Clear', u:'Sheet',m:25,min:4000,max:8000,h:'39206110',t:['polycarbonate','6mm','8x4','clear']},
  {n:'HDPE Sheet 3mm 8x4 Black', u:'Sheet',m:25,min:2000,max:4500,h:'39201099',t:['hdpe sheet','3mm','8x4','black']},
  {n:'ABS Sheet 3mm 8x4 White', u:'Sheet',m:25,min:3000,max:6000,h:'39203010',t:['abs sheet','3mm','8x4','white']},
  {n:'FRP Sheet 1.5mm 8x4 Transparent', u:'Sheet',m:25,min:3000,max:6000,h:'39219010',t:['frp sheet','1.5mm','8x4','roofing']},
  {n:'Nylon Sheet 6mm 8x4 Natural', u:'Sheet',m:25,min:5000,max:10000,h:'39209910',t:['nylon sheet','6mm','8x4','natural']},
  {n:'PTFE Sheet 3mm 4x4 White', u:'Sheet',m:10,min:8000,max:15000,h:'39209999',t:['ptfe sheet','3mm','4x4','teflon']},
  {n:'PVC Foam Sheet 5mm 8x4 White', u:'Sheet',m:25,min:2500,max:5000,h:'39204300',t:['pvc foam','5mm','8x4','white']},
  {n:'UHMDPE Sheet 12mm 8x4', u:'Sheet',m:10,min:15000,max:30000,h:'39201099',t:['uhmdpe','12mm','8x4','wear']},
  {n:'Polypropylene Sheet 5mm 8x4', u:'Sheet',m:25,min:2000,max:4000,h:'39202090',t:['pp sheet','5mm','8x4']},
]);
ct('Plastics & Polymers', 'Plastic Pipes', [
  {n:'HDPE Pipe 32mm PN10 100m Roll', u:'Roll',m:10,min:3000,max:6000,h:'39172110',t:['hdpe pipe','32mm','pn10','100m']},
  {n:'HDPE Pipe 63mm PN6 50m Coil', u:'Coil',m:5,min:8000,max:15000,h:'39172110',t:['hdpe pipe','63mm','pn6','50m']},
  {n:'HDPE Pipe 20mm PN12 200m Roll', u:'Roll',m:10,min:2000,max:4000,h:'39172110',t:['hdpe pipe','20mm','pn12','200m']},
  {n:'UPVC Pipe 4 Inch 3m Pressure', u:'Piece',m:25,min:800,max:2000,h:'39172310',t:['upvc pipe','4 inch','3m','pressure']},
  {n:'CPVC Pipe 1 Inch 3m Hot Water', u:'Piece',m:25,min:300,max:700,h:'39172310',t:['cpvc pipe','1 inch','3m','hot']},
  {n:'PVC Pipe 6 Inch 3m SWR', u:'Piece',m:25,min:1000,max:3000,h:'39172310',t:['pvc pipe','6 inch','swr','3m']},
  {n:'Drain Pipe 110mm PVC 3m', u:'Piece',m:25,min:250,max:600,h:'39172310',t:['drain pipe','110mm','pvc','3m']},
  {n:'HDPE Coil Pipe 16mm 200m Drip', u:'Roll',m:10,min:1500,max:3000,h:'39172110',t:['hdpe coil','16mm','200m','drip']},
  {n:'MDPE Pipe 50mm PN8 50m', u:'Coil',m:5,min:6000,max:12000,h:'39172110',t:['mdpe pipe','50mm','pn8','50m']},
  {n:'PVC Suction Pipe 2 Inch 3m', u:'Piece',m:25,min:500,max:1200,h:'39172310',t:['suction pipe','2 inch','pvc','3m']},
]);

export function generateProductForCategory(
  categoryName: string,
  subcategoryName: string
): ProductOut[] {
  const items = templates[categoryName]?.[subcategoryName];
  if (!items) return [];
  const count = 32 + Math.floor(Math.random() * 9);
  const out: ProductOut[] = [];
  for (let i = 0; i < count; i++) {
    if (i < items.length) {
      out.push({ name: items[i].n, unit: items[i].u, moq: items[i].m, priceRangeMin: items[i].min, priceRangeMax: items[i].max, hsCode: items[i].h, tags: items[i].t });
    } else {
      const t = items[i % items.length];
      out.push({ name: `${t.n} - Var ${Math.floor(i / items.length) + 2}`, unit: t.u, moq: t.m, priceRangeMin: t.min, priceRangeMax: t.max, hsCode: t.h, tags: t.t });
    }
  }
  return out;
}

export function generateAllProducts(): Array<ProductOut & { categoryName: string; subcategoryName: string }> {
  const all: Array<ProductOut & { categoryName: string; subcategoryName: string }> = [];
  for (const [cat, subs] of Object.entries(templates)) {
    for (const [sub, items] of Object.entries(subs)) {
      const count = 32 + Math.floor(Math.random() * 9);
      for (let i = 0; i < count; i++) {
        const t = items[i % items.length];
        all.push({
          name: i < items.length ? t.n : `${t.n} - Var ${Math.floor(i / items.length) + 2}`,
          unit: t.u, moq: t.m, priceRangeMin: t.min, priceRangeMax: t.max, hsCode: t.h, tags: t.t,
          categoryName: cat, subcategoryName: sub,
        });
      }
    }
  }
  return all;
}
