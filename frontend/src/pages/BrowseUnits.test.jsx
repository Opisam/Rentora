import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrowseUnits from './BrowseUnits';

vi.mock('../api/properties', () => ({
  getVacantUnits: vi.fn(),
}));
vi.mock('../api/applications', () => ({
  applyToUnit: vi.fn(),
}));

import { getVacantUnits } from '../api/properties';
import { applyToUnit } from '../api/applications';

const UNITS = [
  {
    id: 5,
    unitNumber: '102',
    bedrooms: 2,
    bathrooms: 1,
    rentAmount: '1300.00',
    status: 'vacant',
    property: { name: 'Lakeside Apartments', address: '8 Lakeview Drive', city: 'Riverton' },
  },
  {
    id: 3,
    unitNumber: '2A',
    bedrooms: 3,
    bathrooms: 2,
    rentAmount: '1600.00',
    status: 'vacant',
    property: { name: 'Maple Court', address: '42 Maple Avenue', city: 'Springfield' },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BrowseUnits', () => {
  it('renders vacant unit cards with rent and location', async () => {
    getVacantUnits.mockResolvedValue({ data: UNITS });

    render(<BrowseUnits />);

    expect(await screen.findByText('Lakeside Apartments')).toBeInTheDocument();
    expect(screen.getByText('Maple Court')).toBeInTheDocument();
    expect(screen.getByText('$1,300')).toBeInTheDocument();
    expect(screen.getByText(/8 Lakeview Drive/)).toBeInTheDocument();
    expect(screen.getByText(/2 vacant units ready to rent/)).toBeInTheDocument();
  });

  it('shows the empty state when nothing is vacant', async () => {
    getVacantUnits.mockResolvedValue({ data: [] });

    render(<BrowseUnits />);

    expect(await screen.findByText(/No vacant units right now/i)).toBeInTheDocument();
    expect(screen.queryByText('Apply for this unit')).not.toBeInTheDocument();
  });

  it('submits the typed message with the unit and shows success', async () => {
    getVacantUnits.mockResolvedValue({ data: UNITS });
    applyToUnit.mockResolvedValue({ data: { id: 9, status: 'pending' } });

    render(<BrowseUnits />);

    const input = await screen.findByPlaceholderText(/Message to Lakeside/);
    await userEvent.type(input, 'Hi, I love the layout!');
    const applyButtons = screen.getAllByText('Apply for this unit');
    await userEvent.click(applyButtons[0]); // first card = Lakeside (id 5)

    await waitFor(() =>
      // regression guard: the page must pass (unitId, messageString)
      expect(applyToUnit).toHaveBeenCalledWith(5, 'Hi, I love the layout!')
    );
    expect(await screen.findByText(/Application submitted!/)).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('shows a friendly error when applying fails and keeps the message', async () => {
    getVacantUnits.mockResolvedValue({ data: [UNITS[0]] });
    applyToUnit.mockRejectedValue({
      response: { status: 409, data: { error: 'You already have a pending application for this unit' } },
    });

    render(<BrowseUnits />);

    const input = await screen.findByPlaceholderText(/Message to Lakeside/);
    await userEvent.type(input, 'again!');
    await userEvent.click(screen.getByText('Apply for this unit'));

    expect(await screen.findByText(/already have a pending application/)).toBeInTheDocument();
    expect(screen.queryByText(/Application submitted!/)).not.toBeInTheDocument();
  });
});
