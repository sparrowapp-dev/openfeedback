import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '../../stores/authStore';
import { Button, Card, CardTitle, CardDescription, Input, Textarea, Modal, Spinner, Badge } from '../../components/ui';
import { IChangelog } from '@openfeedback/shared';
import { listChangelog, createChangelogEntry, updateChangelogEntry, deleteChangelogEntry } from '../../services/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CHANGELOG_TYPES: { id: string; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'improved', label: 'Improved' },
  { id: 'fixed', label: 'Fixed' },
];

export function AdminChangelogPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [entries, setEntries] = useState<IChangelog[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IChangelog | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<IChangelog | null>(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [labelsInput, setLabelsInput] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['new']);
  const [publishImmediately, setPublishImmediately] = useState(true);

  useEffect(() => {
    void fetchEntries(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEntries = async (reset = false) => {
    try {
      setIsLoading(true);
      const currentSkip = reset ? 0 : skip;
      const { entries: items, hasMore: more } = await listChangelog({
        limit: 20,
        skip: currentSkip,
      });

      setEntries(reset ? items : [...entries, ...items]);
      setHasMore(more);
      setSkip(currentSkip + items.length);
    } catch (error) {
      console.error('Failed to load changelog entries', error);
      toast.error('Failed to load changelog entries');
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailsModal = (entry: IChangelog) => {
    setSelectedEntry(entry);
    setShowDetailsModal(true);
  };

  const openCreateModal = () => {
    setEditingEntry(null);
    setTitle('');
    setDetails('');
    setLabelsInput('');
    setSelectedTypes(['new']);
    setPublishImmediately(true);
    setShowEditorModal(true);
  };

  const openEditModal = (entry: IChangelog) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setDetails(entry.markdownDetails || entry.plaintextDetails || '');
    setLabelsInput(entry.labels.map((l) => l.name).join(', '));
    setSelectedTypes(entry.types && entry.types.length ? entry.types : []);
    setPublishImmediately(entry.status === 'published');
    setShowEditorModal(true);
  };

  if (!user?.isAdmin) {
    return (
      <Card className="of-text-center of-py-12">
        <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
          Access Denied
        </h3>
        <p className="of-text-gray-600">
          You need admin privileges to access this page.
        </p>
      </Card>
    );
  }

  const handleToggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      const labels = labelsInput
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const entry = await createChangelogEntry({
        title: title.trim(),
        markdownDetails: details,
        labels,
        types: selectedTypes,
        publish: publishImmediately,
      });

      toast.success(publishImmediately ? 'Changelog entry published!' : 'Changelog entry saved as draft');
      setEntries((prev) => [entry, ...prev]);
      setShowEditorModal(false);
      setTitle('');
      setDetails('');
      setLabelsInput('');
      setSelectedTypes(['new']);
      setPublishImmediately(true);
    } catch (error: any) {
      console.error('Failed to create changelog entry', error);
      toast.error(error?.message || 'Failed to create changelog entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      const labels = labelsInput
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const updated = await updateChangelogEntry({
        id: editingEntry.id,
        title: title.trim(),
        markdownDetails: details,
        labels,
        types: selectedTypes,
        publish: publishImmediately,
      });

      toast.success('Changelog entry updated');
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditingEntry(null);
      setShowEditorModal(false);
    } catch (error: any) {
      console.error('Failed to update changelog entry', error);
      toast.error(error?.message || 'Failed to update changelog entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, titleToDelete: string) => {
    if (!confirm(`Are you sure you want to delete "${titleToDelete}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteChangelogEntry(id);
      toast.success('Changelog entry deleted');
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (error: any) {
      console.error('Failed to delete changelog entry', error);
      toast.error(error?.message || 'Failed to delete changelog entry');
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  };

  const getDescriptionSnippet = (entry: IChangelog) => {
    const text = (entry.plaintextDetails || entry.markdownDetails || '').trim();
    if (!text) return '—';
    const maxLength = 160;
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1).trimEnd() + '…';
  };

  return (
    <div className="of-space-y-6">
      {/* Header */}
      <div className="of-flex of-items-center of-justify-between">
        <div>
          <h1 className="of-text-2xl of-font-bold of-text-gray-900">Changelog</h1>
          <p className="of-text-gray-600 of-mt-1">
            Create and manage product updates for your users.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          leftIcon={<PlusIcon className="of-w-5 of-h-5" />}
        >
          New Entry
        </Button>
      </div>

      {/* List */}
      <Card padding="none">
        {isLoading && entries.length === 0 ? (
          <div className="of-flex of-justify-center of-py-12">
            <Spinner size="lg" />
          </div>
        ) : entries.length === 0 ? (
          <div className="of-text-center of-py-12 of-px-4">
            <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
              No changelog entries yet
            </h3>
            <p className="of-text-gray-600 of-mb-4">
              Keep your users informed about what’s new and improved.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>New Entry</Button>
          </div>
        ) : (
          <div className="of-overflow-x-auto">
            <table className="of-w-full">
              <thead className="of-bg-gray-50">
                <tr>
                  <th className="of-px-6 of-py-3 of-text-left of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Title
                  </th>
                  <th className="of-px-6 of-py-3 of-text-left of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Status
                  </th>
                  <th className="of-px-6 of-py-3 of-text-left of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Types
                  </th>
                  <th className="of-px-6 of-py-3 of-text-left of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Labels
                  </th>
                  <th className="of-px-6 of-py-3 of-text-left of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Created
                  </th>
                  <th className="of-px-6 of-py-3 of-text-left of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Published
                  </th>
                  <th className="of-px-6 of-py-3 of-text-right of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="of-divide-y of-divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:of-bg-gray-50">
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openDetailsModal(entry)}
                        className="of-text-left of-w-full of-bg-transparent of-border-0 of-p-0 of-cursor-pointer hover:of-underline"
                      >
                        <div className="of-font-medium of-text-gray-900">{entry.title}</div>
                      </button>
                    </td>
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap">
                      {entry.status === 'published' && (
                        <Badge variant="success" size="sm">Published</Badge>
                      )}
                      {entry.status === 'draft' && (
                        <Badge variant="default" size="sm">Draft</Badge>
                      )}
                      {entry.status === 'scheduled' && (
                        <Badge variant="warning" size="sm">Scheduled</Badge>
                      )}
                    </td>
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap of-text-sm of-text-gray-500">
                      <div className="of-flex of-flex-wrap of-gap-1">
                        {entry.types.map((type) => (
                          <Badge key={type} variant="default" size="xs">
                            {type}
                          </Badge>
                        ))}
                        {entry.types.length === 0 && <span className="of-text-xs of-text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap of-text-sm of-text-gray-500">
                      <div className="of-flex of-flex-wrap of-gap-1">
                        {entry.labels.map((label) => (
                          <Badge key={label.id} variant="outline" size="xs">
                            {label.name}
                          </Badge>
                        ))}
                        {entry.labels.length === 0 && <span className="of-text-xs of-text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap of-text-sm of-text-gray-500">
                      {formatDate(entry.created)}
                    </td>
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap of-text-sm of-text-gray-500">
                      {formatDate(entry.publishedAt)}
                    </td>
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap of-text-right">
                      <div className="of-flex of-items-center of-justify-end of-gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(entry)}
                          title="Edit entry"
                        >
                          <PencilIcon className="of-w-4 of-h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="of-text-red-600 hover:of-text-red-700"
                          onClick={() => handleDelete(entry.id, entry.title)}
                          title="Delete entry"
                        >
                          <TrashIcon className="of-w-4 of-h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="of-flex of-justify-center of-py-4">
                <Button
                  variant="outline"
                  onClick={() => void fetchEntries(false)}
                  isLoading={isLoading}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Create / Edit Entry Modal */}
      <Modal
        isOpen={showEditorModal}
        onClose={() => {
          setShowEditorModal(false);
          setEditingEntry(null);
        }}
        title={editingEntry ? 'Edit Changelog Entry' : 'New Changelog Entry'}
      >
        <div className="of-space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., New dashboard experience"
            autoFocus
          />

          <Textarea
            label="Details (Markdown supported)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={6}
          />

          <Input
            label="Labels (comma separated)"
            value={labelsInput}
            onChange={(e) => setLabelsInput(e.target.value)}
            placeholder="e.g., dashboard, performance"
          />

          <div className="of-space-y-2">
            <label className="of-text-sm of-font-medium of-text-gray-700">
              Types
            </label>
            <div className="of-flex of-flex-wrap of-gap-2">
              {CHANGELOG_TYPES.map((type) => {
                const active = selectedTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleToggleType(type.id)}
                    className={
                      'of-inline-flex of-items-center of-rounded-full of-border of-px-3 of-py-1 of-text-xs of-font-medium ' +
                      (active
                        ? 'of-bg-primary of-border-primary of-text-white'
                        : 'of-bg-white of-border-gray-300 of-text-gray-700 hover:of-bg-gray-50')
                    }
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="of-flex of-items-center of-gap-2">
            <input
              type="checkbox"
              checked={publishImmediately}
              onChange={(e) => setPublishImmediately(e.target.checked)}
              className="of-h-4 of-w-4 of-text-primary of-border-gray-300 of-rounded"
            />
            <span className="of-text-sm of-text-gray-700">
              Publish immediately (otherwise save as draft)
            </span>
          </label>

          <div className="of-flex of-justify-end of-gap-3 of-mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditorModal(false);
                setEditingEntry(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingEntry ? handleUpdate : handleCreate}
              isLoading={isSubmitting}
            >
              {editingEntry
                ? 'Save Changes'
                : publishImmediately
                  ? 'Publish'
                  : 'Save Draft'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEntry(null);
        }}
        title={selectedEntry?.title || 'Changelog Entry'}
      >
        {selectedEntry && (
          <div className="of-space-y-4">
            <div className="of-flex of-flex-wrap of-gap-2">
              {selectedEntry.types.map((type) => (
                <Badge key={type} variant="default" size="xs">
                  {type}
                </Badge>
              ))}
              {selectedEntry.labels.map((label) => (
                <Badge key={label.id} variant="outline" size="xs">
                  {label.name}
                </Badge>
              ))}
            </div>

            <div className="of-text-sm of-text-gray-500 of-space-x-4">
              <span>Created: {formatDate(selectedEntry.created)}</span>
              {selectedEntry.publishedAt && (
                <span>Published: {formatDate(selectedEntry.publishedAt)}</span>
              )}
            </div>

            <div className="of-text-sm of-text-gray-800 of-break-words of-max-h-[60vh] of-overflow-y-auto of-prose of-prose-sm of-prose-slate">
              <ReactMarkdown>
                {selectedEntry.markdownDetails || selectedEntry.plaintextDetails || ''}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
