import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/SettingsContext';
import {
  daysInWeek,
  getWeekRange,
  toIso,
  type Period,
} from '../lib/periods';
import { todayKey } from '../lib/categories';
import { radius, spacing, type ThemeColors } from '../theme';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Celdas del mes: null = hueco antes del día 1 (semana empieza lunes). */
function buildMonthGrid(year: number, monthIndex: number): (string | null)[] {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const mondayIndex = (first.getDay() + 6) % 7; // lun=0 … dom=6
  const cells: (string | null)[] = Array.from({ length: mondayIndex }, () => null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toIso(new Date(year, monthIndex, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

type Props = {
  period: Period;
  selected: string;
  onSelect: (iso: string) => void;
  /** Fechas con movimientos (para puntito) */
  markedDates?: Set<string> | string[];
};

export function PeriodCalendar({
  period,
  selected,
  onSelect,
  markedDates,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const selectedDate = parseIso(selected);
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  useEffect(() => {
    const d = parseIso(selected);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selected]);

  const marked = useMemo(() => {
    if (!markedDates) return new Set<string>();
    return markedDates instanceof Set ? markedDates : new Set(markedDates);
  }, [markedDates]);

  const weekRange =
    period === 'week' ? getWeekRange(selected) : null;
  const weekDays =
    period === 'week' ? new Set(daysInWeek(selected)) : null;

  const selectedMonthKey = selected.slice(0, 7);
  const today = todayKey();

  const shiftView = (deltaMonths: number) => {
    const d = new Date(viewYear, viewMonth + deltaMonths, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const shiftYear = (delta: number) => {
    setViewYear((y) => y + delta);
  };

  // Modo año: grilla de 12 meses
  if (period === 'year') {
    return (
      <View style={styles.wrap}>
        <View style={styles.head}>
          <Pressable style={styles.navBtn} onPress={() => shiftYear(-1)}>
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.headTitle}>{viewYear}</Text>
          <Pressable style={styles.navBtn} onPress={() => shiftYear(1)}>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.monthsGrid}>
          {MONTHS_ES.map((name, idx) => {
            const iso = toIso(new Date(viewYear, idx, 1));
            const active = selectedDate.getFullYear() === viewYear &&
              selectedDate.getMonth() === idx;
            return (
              <Pressable
                key={name}
                style={[styles.monthChip, active && styles.monthChipActive]}
                onPress={() => onSelect(iso)}
              >
                <Text
                  style={[
                    styles.monthChipText,
                    active && styles.monthChipTextActive,
                  ]}
                >
                  {name.slice(0, 3)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>Elegí un mes de ese año para anclar la vista anual.</Text>
      </View>
    );
  }

  const cells = buildMonthGrid(viewYear, viewMonth);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable style={styles.navBtn} onPress={() => shiftView(-1)}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.headTitle}>
          {MONTHS_ES[viewMonth]} {viewYear}
        </Text>
        <Pressable style={styles.navBtn} onPress={() => shiftView(1)}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
      </View>

      <Text style={styles.modeHint}>
        {period === 'day' && 'Tocá un día para ver sus estadísticas'}
        {period === 'week' && 'Tocá un día: se selecciona toda su semana (lun–dom)'}
        {period === 'month' && 'Tocá cualquier día para ver ese mes'}
      </Text>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((iso, i) => {
          if (!iso) {
            return <View key={`e-${i}`} style={styles.cell} />;
          }
          const isToday = iso === today;
          const isSelectedDay = period === 'day' && iso === selected;
          const inWeek = period === 'week' && !!weekDays?.has(iso);
          const weekAnchorDay = period === 'week' && iso === selected;
          const inMonth =
            period === 'month' && iso.startsWith(selectedMonthKey);
          const solid = isSelectedDay || weekAnchorDay;
          const soft = (inWeek && !weekAnchorDay) || inMonth;
          const hasData = marked.has(iso);
          const isWeekStart =
            period === 'week' && weekRange && iso === weekRange.start;
          const isWeekEnd =
            period === 'week' && weekRange && iso === weekRange.end;

          return (
            <Pressable
              key={iso}
              style={[
                styles.cell,
                soft && styles.cellSoft,
                inWeek && styles.cellWeek,
                isWeekStart && styles.cellWeekStart,
                isWeekEnd && styles.cellWeekEnd,
                solid && styles.cellActive,
                isToday && !solid && !soft && styles.cellToday,
              ]}
              onPress={() => {
                if (period === 'month') {
                  onSelect(`${iso.slice(0, 7)}-01`);
                } else {
                  onSelect(iso);
                }
                setViewYear(parseIso(iso).getFullYear());
                setViewMonth(parseIso(iso).getMonth());
              }}
            >
              <Text
                style={[
                  styles.dayNum,
                  soft && styles.dayNumSoft,
                  solid && styles.dayNumActive,
                  isToday && !solid && styles.dayNumToday,
                ]}
              >
                {Number(iso.slice(8, 10))}
              </Text>
              {hasData ? (
                <View
                  style={[
                    styles.dot,
                    solid && { backgroundColor: colors.bg },
                  ]}
                />
              ) : (
                <View style={styles.dotSpacer} />
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={styles.todayBtn}
        onPress={() => {
          const t = todayKey();
          onSelect(period === 'month' ? `${t.slice(0, 7)}-01` : t);
          const d = parseIso(t);
          setViewYear(d.getFullYear());
          setViewMonth(d.getMonth());
        }}
      >
        <Text style={styles.todayBtnText}>Ir a hoy</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: 10,
    },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headTitle: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
      textTransform: 'capitalize',
    },
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeHint: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 16,
    },
    hint: {
      color: colors.textDim,
      fontSize: 12,
      lineHeight: 16,
    },
    weekRow: {
      flexDirection: 'row',
    },
    weekday: {
      flex: 1,
      textAlign: 'center',
      color: colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      paddingVertical: 2,
    },
    cellActive: {
      backgroundColor: colors.accent,
      borderRadius: 10,
    },
    cellSoft: {
      backgroundColor: colors.accentSoft,
    },
    cellWeek: {
      borderRadius: 0,
    },
    cellWeekStart: {
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10,
    },
    cellWeekEnd: {
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
    },
    cellToday: {
      borderWidth: 1,
      borderColor: colors.accent,
    },
    dayNum: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    dayNumActive: {
      color: colors.bg,
    },
    dayNumSoft: {
      color: colors.accent,
    },
    dayNumToday: {
      color: colors.accent,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.accent,
      marginTop: 2,
    },
    dotSpacer: {
      width: 4,
      height: 4,
      marginTop: 2,
    },
    todayBtn: {
      alignSelf: 'center',
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    todayBtnText: {
      color: colors.accent,
      fontWeight: '700',
      fontSize: 13,
    },
    monthsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    monthChip: {
      width: '30%',
      flexGrow: 1,
      paddingVertical: 12,
      borderRadius: radius.sm,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    monthChipActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    monthChipText: {
      color: colors.textMuted,
      fontWeight: '600',
      fontSize: 13,
    },
    monthChipTextActive: {
      color: colors.accent,
    },
  });
}
