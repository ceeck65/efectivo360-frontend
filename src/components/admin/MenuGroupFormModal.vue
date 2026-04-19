<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
      <div class="px-6 py-4 border-b border-slate-200">
        <h2 class="text-lg font-semibold text-slate-900">
          {{ group ? 'Editar Grupo' : 'Nuevo Grupo' }}
        </h2>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Name -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">
            Nombre (ID)
          </label>
          <input
            v-model="form.name"
            type="text"
            class="input-field"
            placeholder="Ej: operations"
            required
          />
          <p class="text-xs text-slate-500">Identificador único del grupo (solo letras, números y guiones)</p>
        </div>

        <!-- Label -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">
            Etiqueta
          </label>
          <input
            v-model="form.label"
            type="text"
            class="input-field"
            placeholder="Ej: Operaciones"
            required
          />
          <p class="text-xs text-slate-500">Nombre visible del grupo en el sidebar</p>
        </div>

        <!-- Icon -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">
            Icono
          </label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input
                v-model="form.icon"
                type="text"
                class="input-field pr-10"
                placeholder="Ej: LayoutDashboard"
                readonly
                @click="showIconPicker = true"
              />
              <button
                type="button"
                @click="showIconPicker = true"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <Search class="h-4 w-4" />
              </button>
            </div>
            <div v-if="form.icon" class="flex items-center justify-center w-11 h-11 rounded-md border border-slate-200 bg-slate-50">
              <LucideIcon :name="form.icon" :size="20" />
            </div>
          </div>
          <p class="text-xs text-slate-500">Nombre del icono de Lucide (ej: LayoutDashboard, Settings, Users)</p>
        </div>

        <!-- Icon Picker Modal -->
        <div v-if="showIconPicker" class="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div class="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold text-slate-900">Seleccionar Icono</h3>
              <button
                @click="showIconPicker = false"
                class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
            <div class="mb-4">
              <input
                v-model="iconSearchQuery"
                type="text"
                class="input-field"
                placeholder="Buscar icono..."
              />
            </div>
            <div class="flex-1 overflow-y-auto">
              <div class="grid grid-cols-8 gap-2">
                <button
                  v-for="icon in filteredIcons"
                  :key="icon"
                  type="button"
                  @click="selectIcon(icon)"
                  :class="[
                    'flex items-center justify-center p-2 rounded-lg transition-colors',
                    form.icon === icon
                      ? 'bg-brand-primary text-white'
                      : 'hover:bg-slate-100 text-slate-700'
                  ]"
                  :title="icon"
                >
                  <LucideIcon :name="icon" :size="20" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sort Order -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">
            Orden
          </label>
          <input
            v-model.number="form.sort_order"
            type="number"
            class="input-field"
            placeholder="0"
            min="0"
            required
          />
          <p class="text-xs text-slate-500">Orden de visualización del grupo</p>
        </div>

        <!-- Is Active -->
        <div class="flex items-center gap-2">
          <input
            v-model="form.is_active"
            type="checkbox"
            id="is_active"
            class="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
          />
          <label for="is_active" class="text-sm font-medium text-slate-700">
            Activo
          </label>
        </div>
      </form>

      <div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
        <button
          @click="$emit('close')"
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          @click="handleSubmit"
          type="submit"
          class="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
        >
          {{ group ? 'Guardar' : 'Crear' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Search, X } from 'lucide-vue-next';
import LucideIcon from '@/components/lucide/LucideIcon.vue';

interface MenuGroup {
  id: string;
  ulid: string;
  name: string;
  label: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const props = defineProps<{
  isOpen: boolean;
  group: MenuGroup | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [data: Partial<MenuGroup>];
}>();

const form = ref({
  name: '',
  label: '',
  icon: '',
  sort_order: 0,
  is_active: true,
});

const lucideIcons = [
  'LayoutDashboard', 'Settings', 'Users', 'Package', 'ShoppingCart', 'FileText',
  'Calculator', 'PieChart', 'TrendingUp', 'Wallet', 'CreditCard', 'Banknote',
  'Receipt', 'Invoice', 'BarChart', 'Activity', 'Archive', 'ClipboardList',
  'CheckSquare', 'Calendar', 'Clock', 'Bell', 'Search', 'Filter', 'Apple',
  'Carrot', 'Leaf', 'Tree', 'Flower', 'Flower2', 'Sprout', 'Wheat',
  'Home', 'Menu', 'X', 'ChevronLeft', 'ChevronRight', 'ChevronDown', 'ChevronUp',
  'Plus', 'Minus', 'Edit', 'Trash', 'Save', 'Download', 'Upload', 'Share',
  'Copy', 'Cut', 'Paste', 'Undo', 'Redo', 'ZoomIn', 'ZoomOut', 'Maximize',
  'Minimize', 'RotateCw', 'RotateCcw', 'RefreshCw', 'RefreshCcw', 'Play', 'Pause',
  'Stop', 'SkipBack', 'SkipForward', 'FastForward', 'Rewind', 'Volume2', 'VolumeX',
  'Mute', 'Mic', 'MicOff', 'Video', 'VideoOff', 'Camera', 'CameraOff', 'Image',
  'Film', 'Music', 'Headphones', 'Radio', 'Cast', 'Tv', 'Monitor', 'Laptop',
  'Smartphone', 'Tablet', 'Phone', 'PhoneCall', 'PhoneIncoming', 'PhoneOutgoing',
  'Mail', 'MailOpen', 'Send', 'MessageSquare', 'MessageCircle', 'AtSign', 'Hash',
  'User', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'Users', 'Users2',
  'UserCircle', 'UserCog', 'UserShield', 'UserMinus', 'UserPlus', 'Heart',
  'HeartHandshake', 'Star', 'StarHalf', 'ThumbsUp', 'ThumbsDown', 'Smile',
  'Frown', 'Meh', 'Angry', 'Laugh', 'Kiss', 'Sun', 'Moon', 'Cloud', 'CloudRain',
  'CloudSnow', 'CloudLightning', 'CloudDrizzle', 'CloudFog', 'Wind', 'Umbrella',
  'Thermometer', 'Snowflake', 'Sunrise', 'Sunset', 'Mountain', 'Map', 'MapPin',
  'Compass', 'Navigation', 'Globe', 'Earth', 'Target', 'Crosshair', 'Anchor',
  'Flag', 'FlagTriangleLeft', 'FlagTriangleRight', 'Award', 'Medal', 'Trophy',
  'Crown', 'Gem', 'Sparkles', 'Zap', 'ZapOff', 'Lightbulb', 'LightbulbOff',
  'CandlestickChart', 'LineChart', 'BarChart2', 'BarChart3', 'BarChart4',
  'AreaChart', 'PieChart', 'Donut', 'Scatter', 'TrendingUp', 'TrendingDown',
  'TrendingFlat', 'Activity', 'Pulse', 'Heartbeat', 'Monitor', 'Cpu', 'Server',
  'Database', 'HardDrive', 'FloppyDisk', 'Cd', 'Dvd', 'Memory', 'Microchip',
  'CircuitBoard', 'Keyboard', 'Mouse', 'MousePointer', 'MousePointerClick',
  'Touchpad', 'Gamepad', 'Joystick', 'Wand', 'Wand2', 'Eraser', 'Pencil',
  'PenTool', 'Highlighter', 'Marker', 'Paintbrush', 'Palette', 'Eyedropper',
  'Scissors', 'Ruler', 'Box', 'Package', 'Archive', 'File', 'FileText', 'FileCode',
  'FileImage', 'FileVideo', 'FileAudio', 'FileArchive', 'FileSpreadsheet',
  'FilePieChart', 'FileBarChart', 'FileCheck', 'FileClock', 'FileX', 'FilePlus',
  'FileMinus', 'FileSearch', 'FileQuestion', 'FileLock', 'FileUnlock', 'FileKey',
  'FileWarning', 'FileAlert', 'FileHeart', 'FileStack', 'Folder', 'FolderOpen',
  'FolderOpenDot', 'FolderPlus', 'FolderMinus', 'FolderTree', 'FolderLock',
  'FolderUnlock', 'FolderHeart', 'FolderKanban', 'FolderGit', 'FolderGit2',
  'Trash', 'Trash2', 'Trash2', 'Recycle', 'Trash2', 'Trash', 'Trash2',
  'Lock', 'Unlock', 'Key', 'KeyRound', 'Shield', 'ShieldCheck', 'ShieldAlert',
  'ShieldClose', 'ShieldQuestion', 'ShieldHalf', 'ShieldX', 'Security', 'Fingerprint',
  'IdCard', 'CreditCard', 'Banknote', 'Wallet', 'Coins', 'Landmark', 'Building',
  'Building2', 'Building4', 'Home', 'HomePlus', 'HomeMinus', 'HomeCheck',
  'HomeX', 'DoorOpen', 'DoorClosed', 'Warehouse', 'Store', 'Shop', 'ShoppingBag',
  'ShoppingCart', 'ShoppingBasket', 'Cart', 'CartPlus', 'CartMinus', 'CartX',
  'Truck', 'Package', 'PackageCheck', 'PackageX', 'PackageOpen', 'PackageSearch',
  'Inbox', 'InboxIcon', 'Archive', 'ArchiveX', 'ArchiveRestore', 'BoxSelect',
  'Check', 'CheckCircle', 'CheckCircle2', 'CheckSquare', 'ChevronCheck',
  'CircleCheck', 'CircleCheckBig', 'CircleDashed', 'CircleDot', 'CircleEllipsis',
  'CircleEqual', 'CircleMinus', 'CircleOff', 'CirclePause', 'CirclePlay',
  'CirclePlus', 'CircleSlash', 'CircleStop', 'CircleUser', 'CircleX', 'CircleAlert',
  'CircleHelp', 'CircleInfo', 'CirclePower', 'CircleDollar', 'CircleFading',
  'CircleEllipsis', 'CircleDashed', 'CircleDot', 'CircleEqual', 'CircleMinus',
  'CircleOff', 'CirclePause', 'CirclePlay', 'CirclePlus', 'CircleSlash', 'CircleStop',
  'CircleUser', 'CircleX', 'CircleAlert', 'CircleHelp', 'CircleInfo', 'CirclePower',
  'CircleDollar', 'CircleFading', 'AlertCircle', 'AlertTriangle', 'AlertOctagon',
  'AlertDiamond', 'Alert', 'Info', 'HelpCircle', 'HelpOctagon', 'HelpDiamond',
  'Help', 'X', 'XCircle', 'XOctagon', 'XDiamond', 'Check', 'CheckCircle',
  'CheckCircle2', 'CheckSquare', 'ChevronCheck', 'CircleCheck', 'CircleCheckBig',
  'CircleDashed', 'CircleDot', 'CircleEllipsis', 'CircleEqual', 'CircleMinus',
  'CircleOff', 'CirclePause', 'CirclePlay', 'CirclePlus', 'CircleSlash', 'CircleStop',
  'CircleUser', 'CircleX', 'CircleAlert', 'CircleHelp', 'CircleInfo', 'CirclePower',
  'CircleDollar', 'CircleFading', 'Square', 'SquareDot', 'SquareDashed', 'SquareCheck',
  'SquareCheckBig', 'SquareX', 'SquareMinus', 'SquarePlus', 'SquareDivide', 'SquareEqual',
  'SquareSlash', 'SquareTerminal', 'SquareArrowUp', 'SquareArrowDown', 'SquareArrowLeft',
  'SquareArrowRight', 'SquareArrowOut', 'SquareArrowIn', 'SquareM', 'SquareStack',
  'SquaresFour', 'Grid', 'Grid3x3', 'Grid2x2', 'GridDots', 'Grip', 'GripVertical',
  'GripHorizontal', 'Move', 'Move3D', 'MoveDiagonal', 'MoveDiagonal2', 'MoveHorizontal',
  'MoveVertical', 'Resize', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ArrowUpCircle', 'ArrowDownCircle', 'ArrowLeftCircle', 'ArrowRightCircle',
  'ArrowUpSquare', 'ArrowDownSquare', 'ArrowLeftSquare', 'ArrowRightSquare',
  'ArrowUpLeft', 'ArrowUpRight', 'ArrowDownLeft', 'ArrowDownRight', 'ArrowUpFromLine',
  'ArrowDownFromLine', 'ArrowLeftFromLine', 'ArrowRightFromLine', 'ArrowUpToLine',
  'ArrowDownToLine', 'ArrowLeftToLine', 'ArrowRightToLine', 'ArrowUpLeftFromCenter',
  'ArrowUpRightFromCenter', 'ArrowDownLeftFromCenter', 'ArrowDownRightFromCenter',
  'ArrowUpLeftToCenter', 'ArrowUpRightToCenter', 'ArrowDownLeftToCenter', 'ArrowDownRightToCenter',
  'ChevronUp', 'ChevronDown', 'ChevronLeft', 'ChevronRight', 'ChevronUpCircle',
  'ChevronDownCircle', 'ChevronLeftCircle', 'ChevronRightCircle', 'ChevronUpSquare',
  'ChevronDownSquare', 'ChevronLeftSquare', 'ChevronRightSquare', 'ChevronUpLeft',
  'ChevronUpRight', 'ChevronDownLeft', 'ChevronDownRight', 'ChevronFirst', 'ChevronLast',
  'ChevronUpChevronDown', 'ChevronLeftChevronRight', 'ChevronUpCircleDot',
  'ChevronDownCircleDot', 'ChevronLeftCircleDot', 'ChevronRightCircleDot',
  'ChevronUpDot', 'ChevronDownDot', 'ChevronLeftDot', 'ChevronRightDot',
  'CornerUpLeft', 'CornerUpRight', 'CornerDownLeft', 'CornerDownRight',
  'CornerUpLeftDouble', 'CornerUpRightDouble', 'CornerDownLeftDouble', 'CornerDownRightDouble',
  'Expand', 'Shrink', 'ExpandVertical', 'ShrinkVertical', 'ExpandHorizontal', 'ShrinkHorizontal',
  'Maximize', 'Minimize', 'Maximize2', 'Minimize2', 'Fullscreen', 'Minimize2', 'Move',
  'Move3D', 'MoveDiagonal', 'MoveDiagonal2', 'MoveHorizontal', 'MoveVertical', 'Resize',
  'MoreHorizontal', 'MoreVertical', 'MoreHorizontal', 'MoreVertical', 'Ellipsis',
  'EllipsisVertical', 'EllipsisHorizontal', 'CircleEllipsis', 'CircleDashed',
  'CircleDot', 'CircleEqual', 'CircleMinus', 'CircleOff', 'CirclePause', 'CirclePlay',
  'CirclePlus', 'CircleSlash', 'CircleStop', 'CircleUser', 'CircleX', 'CircleAlert',
  'CircleHelp', 'CircleInfo', 'CirclePower', 'CircleDollar', 'CircleFading',
  'List', 'ListChecks', 'ListFilter', 'ListMusic', 'ListOrdered', 'ListTodo',
  'ListTree', 'ListX', 'ListVideo', 'ListEnd', 'ListStart', 'ListPlus', 'ListMinus',
  'Columns', 'Rows', 'Table', 'Table2', 'Grid', 'Grid3x3', 'Grid2x2', 'GridDots',
  'Calendar', 'CalendarClock', 'CalendarDays', 'CalendarHeart', 'CalendarCheck',
  'CalendarX', 'CalendarSearch', 'CalendarRange', 'CalendarMinus', 'CalendarPlus',
  'Clock', 'Clock1', 'Clock2', 'Clock3', 'Clock4', 'Clock5', 'Clock6', 'Clock7',
  'Clock8', 'Clock9', 'Clock10', 'Clock11', 'Clock12', 'AlarmClock', 'AlarmClockCheck',
  'AlarmClockOff', 'AlarmSmoking', 'Timer', 'TimerReset', 'TimerOff', 'Hourglass',
  'HourglassEmpty', 'Watch', 'Stopwatch', 'Timer'
];

const showIconPicker = ref(false);
const iconSearchQuery = ref('');

const filteredIcons = computed(() => {
  if (!iconSearchQuery.value.trim()) {
    return lucideIcons;
  }
  const query = iconSearchQuery.value.toLowerCase();
  return lucideIcons.filter(icon =>
    icon.toLowerCase().includes(query)
  );
});

const selectIcon = (icon: string) => {
  form.value.icon = icon;
  showIconPicker.value = false;
  iconSearchQuery.value = '';
};

watch(() => props.group, (newGroup) => {
  if (newGroup) {
    form.value = {
      name: newGroup.name,
      label: newGroup.label,
      icon: newGroup.icon,
      sort_order: newGroup.sort_order,
      is_active: newGroup.is_active,
    };
  } else {
    form.value = {
      name: '',
      label: '',
      icon: '',
      sort_order: 0,
      is_active: true,
    };
  }
}, { immediate: true });

const handleSubmit = () => {
  emit('save', form.value);
};
</script>

<style scoped>
.input-field {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
</style>
