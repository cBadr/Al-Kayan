-- Add "excused" status (بعذر) to attendance_status enum.
alter type attendance_status add value if not exists 'excused';
