import { MenuItem, Select, SelectChangeEvent } from "@mui/material";

interface ReviewerDropdownProps {
  value: string;
  onChange: (value: string) => void;
  contributors: Record<string, string>;
  className?: string; // Optional className prop
}

const selectStyle = {
  fontFamily: '"ClashDisplay", sans-serif',
  fontSize: "0.875rem",
  minWidth: "220px",
  backgroundColor: "white", // Add white background
  "& MuiOutlinedInputNotchedOutline": {
    borderColor: "#ced4da"
  },
  "&:hover MuiOutlinedInputNotchedOutline": {
    borderColor: "#86b7fe"
  },
  "&.MuiFocused MuiOutlinedInputNotchedOutline": {
    borderColor: "#86b7fe",
    borderWidth: "1px"
  }
};

const menuStyle = {
  fontSize: "12px",
  fontFamily: '"ClashDisplay", sans-serif'
};

const ReviewerDropdown: React.FC<ReviewerDropdownProps> = ({
  value,
  onChange,
  contributors,
  className // Add className to props
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  return (
    <Select
      value={value || ""}
      onChange={handleChange}
      size="small"
      style={selectStyle}
      className={className} // Apply the className
      displayEmpty
      MenuProps={{
        PaperProps: {
          style: menuStyle
        }
      }}
    >
      <MenuItem value="" style={menuStyle}>
        <em>Select Reviewer</em>
      </MenuItem>
      {Object.entries(contributors).length > 0 ? (
        Object.entries(contributors).map(([email, role], index) => (
          <MenuItem key={index} value={email} style={menuStyle}>
            {email} ({role})
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled value="" style={menuStyle}>
          No Contributors Available
        </MenuItem>
      )}
    </Select>
  );
};

export default ReviewerDropdown;
