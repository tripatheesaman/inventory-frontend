import * as React from "react";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Create a custom theme to match your app's styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#0f172a', // Tailwind slate-900
    },
    background: {
      paper: '#ffffff',
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '0.375rem', // Tailwind rounded-md
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e2e8f0', // Tailwind slate-200
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0f172a', // Tailwind slate-900
          },
        },
        input: {
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem', // Tailwind rounded-lg
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // Tailwind shadow-md
        },
      },
    },
  },
});

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date | null) => void;
  className?: string;
}

function Calendar({ value, onChange, className }: CalendarProps) {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          value={value || null}
          onChange={onChange}
          slotProps={{
            textField: {
              size: "small",
              className,
            },
            day: {
              sx: {
                '&.Mui-selected': {
                  backgroundColor: '#0f172a', // Tailwind slate-900
                  '&:hover': {
                    backgroundColor: '#1e293b', // Tailwind slate-800
                  },
                },
                '&:hover': {
                  backgroundColor: '#f1f5f9', // Tailwind slate-100
                },
              },
            },
          }}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

Calendar.displayName = "Calendar";
export { Calendar };
