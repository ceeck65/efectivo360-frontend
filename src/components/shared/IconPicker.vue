<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div class="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[80vh] overflow-hidden flex flex-col dark:border-white/[0.06] dark:bg-[#141824]">
      <!-- Header -->
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Seleccionar Icono</h3>
        <button
          @click="handleClose"
          class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-[#1a1f2e] dark:hover:text-slate-300"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Search -->
      <div class="mb-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            v-model="iconSearchQuery"
            type="text"
            class="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/[0.06] dark:bg-[#1a1f2e] dark:text-slate-300"
            placeholder="Buscar iconos..."
          />
        </div>
      </div>

      <!-- Icons Grid -->
      <div class="flex-1 overflow-y-auto grid grid-cols-8 gap-2 p-2 border border-slate-200 rounded-lg dark:border-white/[0.06]">
        <button
          v-for="icon in filteredIcons"
          :key="icon"
          type="button"
          @click="selectIcon(icon)"
          :class="[
            'flex items-center justify-center p-2 rounded-lg transition-colors',
            modelValue === icon 
              ? 'bg-cyan-600 text-white dark:bg-cyan-500' 
              : 'hover:bg-slate-100 dark:hover:bg-[#1a1f2e]'
          ]"
          :title="icon"
        >
          <LucideIcon :name="icon" :size="20" />
        </button>
      </div>

      <!-- Footer -->
      <div class="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{{ filteredIcons.length }} iconos encontrados</span>
        <span v-if="modelValue">Seleccionado: {{ modelValue }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, Search } from 'lucide-vue-next';
import LucideIcon from '@/components/lucide/LucideIcon.vue';

interface Props {
  isOpen: boolean;
  modelValue?: string;
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void;
  (e: 'update:modelValue', value: string): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const iconSearchQuery = ref('');

// Lista de iconos Lucide disponibles
const availableIcons = [
  'LayoutDashboard', 'Users', 'Settings', 'Building2', 'CreditCard', 'BarChart3',
  'Package', 'Database', 'Tags', 'Waypoints', 'MessageSquare', 'Receipt',
  'Shield', 'ShieldCheck', 'Briefcase', 'Plug', 'Bot', 'Globe', 'Map',
  'Coins', 'Flag', 'Wallet', 'DollarSign', 'Store', 'ShoppingCart',
  'Home', 'Menu', 'Search', 'Filter', 'Plus', 'Minus', 'X', 'Check',
  'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 'ArrowUp',
  'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Edit', 'Trash2', 'RefreshCw',
  'Download', 'Upload', 'Share', 'Copy', 'Link', 'ExternalLink', 'Star',
  'Heart', 'Bell', 'Mail', 'Phone', 'Calendar', 'Clock', 'User', 'Lock',
  'Unlock', 'Eye', 'EyeOff', 'Info', 'AlertTriangle', 'AlertCircle',
  'CheckCircle', 'XCircle', 'HelpCircle', 'Zap', 'Flame', 'Sun', 'Moon',
  'Cloud', 'CloudRain', 'CloudSnow', 'Wind', 'Thermometer', 'Droplet',
  'Activity', 'Heartbeat', 'Stethoscope', 'Pill', 'Syringe', 'Microscope',
  'Beaker', 'Flask', 'Atom', 'Magnet', 'ZapOff', 'Power', 'PowerOff',
  'Cpu', 'HardDrive', 'Memory', 'Wifi', 'WifiOff', 'Bluetooth', 'Usb',
  'Battery', 'BatteryCharging', 'BatteryFull', 'BatteryLow', 'BatteryMedium',
  'Monitor', 'Laptop', 'Smartphone', 'Tablet', 'Camera', 'Video', 'Mic',
  'MicOff', 'Volume2', 'VolumeX', 'Play', 'Pause', 'Stop', 'SkipBack',
  'SkipForward', 'Rewind', 'FastForward', 'Music', 'Radio', 'Headphones',
  'Speaker', 'Guitar', 'Piano', 'Drum', 'Trumpet', 'Violin', 'Music2',
  'Film', 'Clapperboard', 'Tv', 'Tv2', 'Radio2', 'Cast', 'CastOff',
  'Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'Browser', 'Globe2',
  'MapPin', 'MapPinOff', 'Navigation', 'Navigation2', 'Compass', 'Route',
  'Car', 'Truck', 'Bus', 'Train', 'Plane', 'Bike', 'Ship', 'Anchor',
  'Fuel', 'Wrench', 'Hammer', 'Screwdriver', 'Drill', 'Saw', 'Paintbrush',
  'Brush', 'Eraser', 'Palette', 'Image', 'ImagePlus', 'ImageMinus',
  'File', 'FileText', 'FileCode', 'FileJson', 'FileXml', 'FileArchive',
  'FileAudio', 'FileVideo', 'FileImage', 'FileSpreadsheet', 'FilePlus',
  'FileMinus', 'FileCheck', 'FileX', 'FileQuestion', 'Folder', 'FolderOpen',
  'FolderPlus', 'FolderMinus', 'Archive', 'ArchiveRestore', 'Inbox',
  'Send', 'Paperclip', 'PaperclipOff', 'Link2', 'Link2Off', 'Unlink',
  'Hash', 'AtSign', 'Percent', 'DollarSign', 'Euro', 'PoundSterling',
  'Yen', 'Rupee', 'Bitcoin', 'CreditCard', 'Landmark', 'Banknote',
  'Wallet', 'PiggyBank', 'TrendingUp', 'TrendingDown', 'BarChart', 'BarChart2',
  'BarChart3', 'BarChart4', 'LineChart', 'PieChart', 'ScatterChart',
  'AreaChart', 'RadarChart', 'GanttChart', 'Calendar', 'CalendarDays',
  'CalendarClock', 'CalendarCheck', 'CalendarX', 'Clock', 'Clock1', 'Clock2',
  'Clock3', 'Clock4', 'Clock5', 'Clock6', 'Clock7', 'Clock8', 'Clock9',
  'Clock10', 'Clock11', 'Clock12', 'Hourglass', 'Timer', 'TimerReset',
  'Watch', 'AlarmClock', 'AlarmClockOff', 'Sunrise', 'Sunset', 'SunDim',
  'Moon', 'MoonStar', 'CloudMoon', 'CloudSun', 'Snowflake', 'Snowman',
  'ThermometerSnow', 'ThermometerSun', 'Wind', 'Cloudy', 'CloudRain',
  'CloudLightning', 'CloudDrizzle', 'CloudFog', 'CloudHail', 'Tornado',
  'Umbrella', 'Droplets', 'Droplet', 'Waves', 'Water', 'Fish', 'Bug',
  'BugOff', 'Spider', 'Bird', 'Feather', 'Egg', 'EggOff', 'Cookie',
  'CookieOff', 'IceCream', 'IceCream2', 'Pizza', 'PizzaOff', 'Hamburger',
  'HamburgerOff', 'HotDog', 'HotDogOff', 'Sandwich', 'SandwichOff',
  'Soup', 'SoupOff', 'Salad', 'SaladOff', 'Carrot', 'Corn', 'Tomato',
  'Apple', 'Cherry', 'Grape', 'Lemon', 'Orange', 'Pear', 'Strawberry',
  'Coffee', 'CoffeeOff', 'Tea', 'TeaOff', 'Beer', 'BeerOff', 'Wine',
  'Martini', 'MartiniOff', 'Cocktail', 'CocktailOff', 'GlassWater',
  'GlassWaterOff', 'Milk', 'MilkOff', 'Baby', 'BabyOff', 'Child', 'ChildOff',
  'User', 'User2', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'Users',
  'Users2', 'UserCircle', 'UserCircle2', 'UserCog', 'UserPlus2', 'UserMinus2',
  'UserCheck2', 'UserX2', 'Settings', 'Settings2', 'Settings4', 'SettingsX',
  'Settings2Off', 'Tuning', 'Sliders', 'SlidersHorizontal', 'SlidersVertical',
  'ToggleLeft', 'ToggleRight', 'Switch', 'Radio', 'RadioOff', 'Checkbox',
  'Check', 'CheckSquare', 'Square', 'SquareCheck', 'SquareCheckBig',
  'SquareDashed', 'SquareDot', 'SquarePen', 'SquareSplitHorizontal',
  'SquareSplitVertical', 'SquareStack', 'SquareX', 'Circle', 'CircleCheck',
  'CircleCheckBig', 'CircleDashed', 'CircleDot', 'CircleEllipsis',
  'CircleEqual', 'CircleMinus', 'CircleOff', 'CirclePause', 'CirclePlay',
  'CirclePlus', 'CircleSlash', 'CircleStop', 'CircleUser', 'CircleX',
  'Triangle', 'TriangleAlert', 'TriangleOff', 'Hexagon', 'HexagonOff',
  'Octagon', 'OctagonX', 'Diamond', 'DiamondOff', 'Pentagon', 'PentagonOff',
  'Star', 'StarHalf', 'StarOff', 'Sparkles', 'Zap', 'ZapOff', 'Flame',
  'FlameOff', 'Candle', 'CandleOff', 'Lightbulb', 'LightbulbOff', 'Lamp',
  'LampDesk', 'LampFloor', 'LampCeiling', 'LampWall', 'Flashlight',
  'FlashlightOff', 'Torch', 'TorchOff', 'Campfire', 'Fire', 'FireOff',
  'Snowflake', 'SnowflakeOff', 'Sun', 'SunOff', 'SunMedium', 'SunSnow',
  'SunWind', 'Sunrise', 'Sunset', 'Moon', 'MoonOff', 'MoonStar', 'CloudMoon',
  'CloudSun', 'CloudRain', 'CloudSnow', 'CloudLightning', 'CloudDrizzle',
  'CloudFog', 'CloudHail', 'Tornado', 'Umbrella', 'UmbrellaOff', 'Droplets',
  'Droplet', 'Waves', 'Water', 'Fish', 'Bug', 'BugOff', 'Spider', 'Bird',
  'Feather', 'Egg', 'EggOff', 'Cookie', 'CookieOff', 'IceCream', 'IceCream2',
  'Pizza', 'PizzaOff', 'Hamburger', 'HamburgerOff', 'HotDog', 'HotDogOff',
  'Sandwich', 'SandwichOff', 'Soup', 'SoupOff', 'Salad', 'SaladOff', 'Carrot',
  'Corn', 'Tomato', 'Apple', 'Cherry', 'Grape', 'Lemon', 'Orange', 'Pear',
  'Strawberry', 'Coffee', 'CoffeeOff', 'Tea', 'TeaOff', 'Beer', 'BeerOff',
  'Wine', 'Martini', 'MartiniOff', 'Cocktail', 'CocktailOff', 'GlassWater',
  'GlassWaterOff', 'Milk', 'MilkOff', 'Baby', 'BabyOff', 'Child', 'ChildOff',
  'Boot', 'Shoe', 'Briefcase', 'Baggage', 'Suitcase', 'Luggage', 'Backpack',
  'ShoppingBag', 'ShoppingBasket', 'ShoppingCart', 'Cart', 'CartOff',
  'Package', 'PackageCheck', 'PackageMinus', 'PackageOpen', 'PackagePlus',
  'PackageSearch', 'PackageX', 'Box', 'BoxSelect', 'Archive', 'ArchiveRestore',
  'ArchiveX', 'Inbox', 'InboxOff', 'Tray', 'TrayOff', 'Clipboard', 'ClipboardCheck',
  'ClipboardCopy', 'ClipboardEdit', 'ClipboardList', 'ClipboardX', 'ClipboardType',
  'File', 'FileText', 'FileCode', 'FileJson', 'FileXml', 'FileArchive',
  'FileAudio', 'FileVideo', 'FileImage', 'FileSpreadsheet', 'FilePlus',
  'FileMinus', 'FileCheck', 'FileX', 'FileQuestion', 'Folder', 'FolderOpen',
  'FolderPlus', 'FolderMinus', 'Archive', 'ArchiveRestore', 'Inbox', 'Send',
  'Paperclip', 'PaperclipOff', 'Link', 'Link2', 'Link2Off', 'Unlink', 'Hash',
  'AtSign', 'Percent', 'DollarSign', 'Euro', 'PoundSterling', 'Yen', 'Rupee',
  'Bitcoin', 'CreditCard', 'Landmark', 'Banknote', 'Wallet', 'PiggyBank',
  'TrendingUp', 'TrendingDown', 'BarChart', 'BarChart2', 'BarChart3', 'BarChart4',
  'LineChart', 'PieChart', 'ScatterChart', 'AreaChart', 'RadarChart', 'GanttChart',
  'Calendar', 'CalendarDays', 'CalendarClock', 'CalendarCheck', 'CalendarX',
  'Clock', 'Clock1', 'Clock2', 'Clock3', 'Clock4', 'Clock5', 'Clock6', 'Clock7',
  'Clock8', 'Clock9', 'Clock10', 'Clock11', 'Clock12', 'Hourglass', 'Timer',
  'TimerReset', 'Watch', 'AlarmClock', 'AlarmClockOff', 'Sunrise', 'Sunset',
  'SunDim', 'Moon', 'MoonStar', 'CloudMoon', 'CloudSun', 'Snowflake', 'Snowman',
  'ThermometerSnow', 'ThermometerSun', 'Wind', 'Cloudy', 'CloudRain', 'CloudLightning',
  'CloudDrizzle', 'CloudFog', 'CloudHail', 'Tornado', 'Umbrella', 'Droplets',
  'Droplet', 'Waves', 'Water', 'Fish', 'Bug', 'BugOff', 'Spider', 'Bird', 'Feather',
  'Egg', 'EggOff', 'Cookie', 'CookieOff', 'IceCream', 'IceCream2', 'Pizza', 'PizzaOff',
  'Hamburger', 'HamburgerOff', 'HotDog', 'HotDogOff', 'Sandwich', 'SandwichOff',
  'Soup', 'SoupOff', 'Salad', 'SaladOff', 'Carrot', 'Corn', 'Tomato', 'Apple',
  'Cherry', 'Grape', 'Lemon', 'Orange', 'Pear', 'Strawberry', 'Coffee', 'CoffeeOff',
  'Tea', 'TeaOff', 'Beer', 'BeerOff', 'Wine', 'Martini', 'MartiniOff', 'Cocktail',
  'CocktailOff', 'GlassWater', 'GlassWaterOff', 'Milk', 'MilkOff', 'Baby', 'BabyOff',
  'Child', 'ChildOff', 'Building', 'Building2', 'Building4', 'Home', 'HomeOff',
  'House', 'HousePlus', 'HouseMinus', 'Warehouse', 'Store', 'Shop', 'ShopOff',
  'Factory', 'FactoryOff', 'Church', 'ChurchOff', 'Mosque', 'MosqueOff',
  'Synagogue', 'SynagogueOff', 'Monument', 'MonumentOff', 'Landmark', 'LandmarkOff',
  'Map', 'MapPin', 'MapPinOff', 'Navigation', 'Navigation2', 'Compass', 'Route',
  'Car', 'Truck', 'Bus', 'Train', 'Plane', 'Bike', 'Ship', 'Anchor', 'Fuel',
  'Wrench', 'Hammer', 'Screwdriver', 'Drill', 'Saw', 'Paintbrush', 'Brush', 'Eraser',
  'Palette', 'Image', 'ImagePlus', 'ImageMinus', 'File', 'FileText', 'FileCode',
  'FileJson', 'FileXml', 'FileArchive', 'FileAudio', 'FileVideo', 'FileImage',
  'FileSpreadsheet', 'FilePlus', 'FileMinus', 'FileCheck', 'FileX', 'FileQuestion',
  'Folder', 'FolderOpen', 'FolderPlus', 'FolderMinus', 'Archive', 'ArchiveRestore',
  'Inbox', 'Send', 'Paperclip', 'PaperclipOff', 'Link', 'Link2', 'Link2Off',
  'Unlink', 'Hash', 'AtSign', 'Percent', 'DollarSign', 'Euro', 'PoundSterling',
  'Yen', 'Rupee', 'Bitcoin', 'CreditCard', 'Landmark', 'Banknote', 'Wallet',
  'PiggyBank', 'TrendingUp', 'TrendingDown', 'BarChart', 'BarChart2', 'BarChart3',
  'BarChart4', 'LineChart', 'PieChart', 'ScatterChart', 'AreaChart', 'RadarChart',
  'GanttChart', 'Calendar', 'CalendarDays', 'CalendarClock', 'CalendarCheck',
  'CalendarX', 'Clock', 'Clock1', 'Clock2', 'Clock3', 'Clock4', 'Clock5', 'Clock6',
  'Clock7', 'Clock8', 'Clock9', 'Clock10', 'Clock11', 'Clock12', 'Hourglass',
  'Timer', 'TimerReset', 'Watch', 'AlarmClock', 'AlarmClockOff', 'Sunrise', 'Sunset',
  'SunDim', 'Moon', 'MoonStar', 'CloudMoon', 'CloudSun', 'Snowflake', 'Snowman',
  'ThermometerSnow', 'ThermometerSun', 'Wind', 'Cloudy', 'CloudRain', 'CloudLightning',
  'CloudDrizzle', 'CloudFog', 'CloudHail', 'Tornado', 'Umbrella', 'Droplets', 'Droplet',
  'Waves', 'Water', 'Fish', 'Bug', 'BugOff', 'Spider', 'Bird', 'Feather', 'Egg',
  'EggOff', 'Cookie', 'CookieOff', 'IceCream', 'IceCream2', 'Pizza', 'PizzaOff',
  'Hamburger', 'HamburgerOff', 'HotDog', 'HotDogOff', 'Sandwich', 'SandwichOff',
  'Soup', 'SoupOff', 'Salad', 'SaladOff', 'Carrot', 'Corn', 'Tomato', 'Apple', 'Cherry',
  'Grape', 'Lemon', 'Orange', 'Pear', 'Strawberry', 'Coffee', 'CoffeeOff', 'Tea',
  'TeaOff', 'Beer', 'BeerOff', 'Wine', 'Martini', 'MartiniOff', 'Cocktail',
  'CocktailOff', 'GlassWater', 'GlassWaterOff', 'Milk', 'MilkOff', 'Baby', 'BabyOff',
  'Child', 'ChildOff', 'Waypoints', 'Boxes', 'Power', 'Settings', 'Edit3', 'Tags',
  'Building', 'Search', 'Plus', 'RefreshCw', 'X'
];

const filteredIcons = computed(() => {
  if (!iconSearchQuery.value.trim()) {
    return availableIcons;
  }
  const query = iconSearchQuery.value.toLowerCase();
  return availableIcons.filter(icon => 
    icon.toLowerCase().includes(query)
  );
});

const selectIcon = (icon: string) => {
  emit('update:modelValue', icon);
  emit('update:isOpen', false);
  emit('close');
};

const handleClose = () => {
  emit('update:isOpen', false);
  emit('close');
};
</script>
