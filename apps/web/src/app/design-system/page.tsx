'use client';

import { 
  Button, Input, Textarea, Select, Card, Badge, StatusBadge, StatCard, 
  PageHeader, RatingScore, MatchScore, Skeleton, EmptyState, ErrorState, 
  Spinner, Avatar, Divider, Logo, Modal, Tabs 
} from '@/design-system';
import { useState } from 'react';
import { Search, Plus, Calendar, Settings, AlertCircle, Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-8 space-y-12 pb-32">
      <PageHeader 
        title="MeetMaze Design System" 
        description="Reference page for all UI components" 
      />

      <section>
        <h2 className="text-h2 font-semibold text-ink mb-4 border-b border-line pb-2">Logos & Avatars</h2>
        <div className="flex flex-wrap items-end gap-8 bg-surface p-6 rounded-card border border-line">
          <div>
            <p className="text-small text-muted mb-2">Logo (sm, md, lg)</p>
            <div className="flex items-end gap-4 bg-canvas p-4 rounded-control">
              <Logo size="sm" />
              <Logo size="md" />
              <Logo size="lg" />
            </div>
          </div>
          <div>
            <p className="text-small text-muted mb-2">Logo (Light variant on dark bg)</p>
            <div className="bg-ink p-4 rounded-control">
              <Logo variant="light" />
            </div>
          </div>
          <div>
            <p className="text-small text-muted mb-2">Avatars (sm, md, lg)</p>
            <div className="flex items-end gap-4 bg-canvas p-4 rounded-control">
              <Avatar name="Rahul Mehta" size="sm" />
              <Avatar name="Jane Doe" size="md" />
              <Avatar name="Alex Smith" size="lg" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-h2 font-semibold text-ink mb-4 border-b border-line pb-2">Buttons</h2>
        <div className="grid md:grid-cols-2 gap-8 bg-surface p-6 rounded-card border border-line">
          <div className="space-y-4">
            <p className="text-small text-muted font-medium">Variants</p>
            <div className="flex flex-wrap gap-4">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-small text-muted font-medium">States & Icons</p>
            <div className="flex flex-wrap gap-4">
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
              <Button leftIcon={<Plus className="w-5 h-5" />}>Left Icon</Button>
              <Button variant="secondary" rightIcon={<Search className="w-5 h-5" />}>Right Icon</Button>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-small text-muted font-medium">Sizes</p>
            <div className="flex flex-wrap items-end gap-4">
              <Button size="sm">Small (32px)</Button>
              <Button size="md">Medium (40px)</Button>
              <Button size="lg">Large (48px)</Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-h2 font-semibold text-ink mb-4 border-b border-line pb-2">Inputs & Forms</h2>
        <div className="bg-surface p-6 rounded-card border border-line max-w-2xl space-y-6">
          <Input label="Standard Input" placeholder="Placeholder text" />
          <Input label="With Hint & Left Icon" hint="This is a helpful hint" leftIcon={<Search className="w-5 h-5" />} placeholder="Search..." />
          <Input label="With Error" error="This field is required" defaultValue="Invalid value" />
          <Select 
            label="Select Dropdown" 
            options={[
              { value: '1', label: 'Option 1' },
              { value: '2', label: 'Option 2' },
            ]} 
          />
          <Textarea label="Textarea" placeholder="Enter multi-line text here..." />
        </div>
      </section>

      <section>
        <h2 className="text-h2 font-semibold text-ink mb-4 border-b border-line pb-2">Badges & Scores</h2>
        <div className="grid md:grid-cols-2 gap-8 bg-surface p-6 rounded-card border border-line">
          <div className="space-y-6">
            <div>
              <p className="text-small text-muted font-medium mb-3">Badge Tones</p>
              <div className="flex flex-wrap gap-3">
                <Badge tone="neutral">Neutral</Badge>
                <Badge tone="primary">Primary</Badge>
                <Badge tone="success">Success</Badge>
                <Badge tone="warning">Warning</Badge>
                <Badge tone="danger">Danger</Badge>
                <Badge tone="accent">Accent</Badge>
              </div>
            </div>
            <div>
              <p className="text-small text-muted font-medium mb-3">StatusBadge component (Maps domain state to tone)</p>
              <div className="flex flex-wrap gap-3">
                <StatusBadge kind="booking" status="HELD" />
                <StatusBadge kind="booking" status="CONFIRMED" />
                <StatusBadge kind="booking" status="CANCELLED" />
                <StatusBadge kind="room" status="ACTIVE" />
                <StatusBadge kind="equipment" status="FAULTY" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-small text-muted font-medium mb-3">RatingScore</p>
              <div className="flex flex-col gap-3 items-start bg-canvas p-4 rounded-control">
                <RatingScore value={8.5} count={42} size="lg" />
                <RatingScore value={6.2} count={12} size="md" />
                <RatingScore value={4.1} size="sm" />
                <RatingScore value={null} />
              </div>
            </div>
            <div>
              <p className="text-small text-muted font-medium mb-3">MatchScore</p>
              <div className="flex gap-6 bg-canvas p-4 rounded-control">
                <MatchScore score={95} reason="Perfect fit" />
                <MatchScore score={65} reason="Missing whiteboard" />
                <MatchScore score={40} reason="Too small" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-h2 font-semibold text-ink mb-4 border-b border-line pb-2">Cards & Layout</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card title="Standard Card" description="With title and description">
            <p className="text-body text-muted">Card content goes here. The padding is uniform and corners are rounded.</p>
          </Card>
          <Card 
            title="Card with Actions" 
            actions={<Button size="sm" variant="ghost">Edit</Button>}
          >
            <p className="text-body text-muted">A card can have actions in the top right corner.</p>
          </Card>
          <StatCard label="Total Revenue" value="₹45,200" delta="+12% this month" icon={<Calendar className="w-5 h-5" />} />
        </div>
      </section>

      <section>
        <h2 className="text-h2 font-semibold text-ink mb-4 border-b border-line pb-2">Feedback & Modals</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-surface p-6 rounded-card border border-line">
              <p className="text-small text-muted font-medium mb-3">Toasts</p>
              <div className="flex gap-4">
                <Button onClick={() => toast.success('Operation successful!')} variant="secondary">Success Toast</Button>
                <Button onClick={() => toast.error('Something went wrong')} variant="secondary">Error Toast</Button>
              </div>
            </div>
            <div className="bg-surface p-6 rounded-card border border-line">
              <p className="text-small text-muted font-medium mb-3">Modal</p>
              <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
              <Modal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                title="Example Modal" 
                description="This is a description for the modal."
                footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button>Confirm</Button></>}
              >
                <p className="text-body text-ink">Modal content goes here. The background is blurred.</p>
              </Modal>
            </div>
            <div className="bg-surface p-6 rounded-card border border-line">
              <p className="text-small text-muted font-medium mb-3">Tabs</p>
              <Tabs 
                tabs={[
                  { id: 'tab1', label: 'Upcoming', badge: 3 },
                  { id: 'tab2', label: 'Past' },
                  { id: 'tab3', label: 'Cancelled' },
                ]}
                value={activeTab}
                onChange={setActiveTab}
              />
              <div className="p-4 text-small text-muted">Active tab: {activeTab}</div>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card title="States">
              <div className="space-y-6 divide-y divide-line">
                <div className="py-4">
                  <p className="text-small text-muted font-medium mb-3">Loading (Skeleton & Spinner)</p>
                  <div className="flex items-center gap-4">
                    <Spinner />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </div>
                <div className="py-4">
                  <p className="text-small text-muted font-medium mb-3">Empty State</p>
                  <div className="bg-canvas rounded-control">
                    <EmptyState 
                      icon={<AlertCircle className="w-8 h-8" />}
                      title="No bookings found"
                      description="You haven't made any bookings yet."
                      action={<Button size="sm">Book a room</Button>}
                    />
                  </div>
                </div>
                <div className="py-4">
                  <p className="text-small text-muted font-medium mb-3">Error State</p>
                  <div className="bg-canvas rounded-control">
                    <ErrorState message="Failed to load data" onRetry={() => {}} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
