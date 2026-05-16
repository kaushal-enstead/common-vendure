'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  checkboxesFeature,
  expandAllFeature,
  hotkeysCoreFeature,
  searchFeature,
  selectionFeature,
  syncDataLoaderFeature,
  TreeState,
} from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { CircleXIcon, FilterIcon, FolderIcon, FolderOpenIcon } from 'lucide-react';
import { Input } from '@vendure/dashboard';
import { Checkbox } from '@base-ui/react/checkbox';
import { Tree, TreeItem, TreeItemLabel } from './tree';

interface Item {
  name: string;
  children?: string[];
}

const indent = 20;

export default function TreeComponent({
  data,
  onStateChange,
}: {
  data: Record<string, Item>;
  onStateChange: (state: Partial<TreeState<Item>>) => void;
}) {
  // Store the initial expanded items to reset when search is cleared
  const initialExpandedItems = ['root'];
  const [state, setState] = useState<Partial<TreeState<Item>>>({});
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [filteredItems, setFilteredItems] = useState<string[]>([]);

  const safeGetItem = (itemId: string): Item => {
    if (data[itemId]) {
      return data[itemId];
    }
    // Fallback: return a dummy item to avoid undefined
    return { name: itemId, children: [] };
  };

  const safeGetChildren = (itemId: string): string[] => {
    return data[itemId]?.children ?? [];
  };

  const tree = useTree<Item>({
    state,
    setState,
    initialState: {
      expandedItems: initialExpandedItems,
    },
    indent,
    rootItemId: 'root',
    getItemName: item => item.getItemData().name,
    isItemFolder: item => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: {
      getItem: safeGetItem,
      getChildren: safeGetChildren,
    },
    canCheckFolders: true,
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      searchFeature,
      expandAllFeature,
      checkboxesFeature,
    ],
  });

  // Handle clearing the search
  const handleClearSearch = () => {
    setSearchValue('');

    // Manually trigger the tree's search onChange with an empty value
    // to ensure item.isMatchingSearch() is correctly updated.
    const searchProps = tree.getSearchInputElementProps();
    if (searchProps.onChange) {
      const syntheticEvent = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>; // Cast to the expected event type
      searchProps.onChange(syntheticEvent);
    }

    // Reset tree state to initial expanded items
    setState(prevState => ({
      ...prevState,
      expandedItems: initialExpandedItems,
    }));

    // Clear custom filtered items
    setFilteredItems([]);

    if (inputRef.current) {
      inputRef.current.focus();
      // Also clear the internal search input
      inputRef.current.value = '';
    }
  };

  // This function determines if an item should be visible based on our custom filtering
  const shouldShowItem = (itemId: string) => {
    if (!searchValue || searchValue.length === 0) return true;
    return filteredItems.includes(itemId);
  };

  // Update filtered items when search value changes
  useEffect(() => {
    if (!searchValue || searchValue.length === 0) {
      setFilteredItems([]);
      return;
    }

    // Get all items
    const allItems = tree.getItems();

    // First, find direct matches
    const directMatches = allItems
      .filter(item => {
        const name = item.getItemName().toLowerCase();
        return name.includes(searchValue.toLowerCase());
      })
      .map(item => item.getId());

    // Then, find all parent IDs of matching items
    const parentIds = new Set<string>();
    directMatches.forEach(matchId => {
      let item = tree.getItems().find(i => i.getId() === matchId);
      while (item?.getParent && item.getParent()) {
        const parent = item.getParent();
        if (parent) {
          parentIds.add(parent.getId());
          item = parent;
        } else {
          break;
        }
      }
    });

    // Find all children of matching items
    const childrenIds = new Set<string>();
    directMatches.forEach(matchId => {
      const item = tree.getItems().find(i => i.getId() === matchId);
      if (item && item.isFolder()) {
        // Get all descendants recursively
        const getDescendants = (itemId: string) => {
          const children = safeGetChildren(itemId);
          children.forEach(childId => {
            childrenIds.add(childId);
            if (safeGetChildren(childId).length) {
              getDescendants(childId);
            }
          });
        };

        getDescendants(item.getId());
      }
    });

    // Combine direct matches, parents, and children
    setFilteredItems([...directMatches, ...Array.from(parentIds), ...Array.from(childrenIds)]);

    // Keep all folders expanded during search to ensure all matches are visible
    // Store current expanded state first
    const currentExpandedItems = tree.getState().expandedItems || [];

    // Get all folder IDs that need to be expanded to show matches
    const folderIdsToExpand = allItems.filter(item => item.isFolder()).map(item => item.getId());

    // Update expanded items in the tree state
    setState(prevState => ({
      ...prevState,
      expandedItems: Array.from(new Set([...currentExpandedItems, ...folderIdsToExpand])),
    }));
  }, [searchValue, tree]);

  useEffect(() => {
    onStateChange(state);
  }, [state]);

  return (
    <div className="flex h-full flex-col gap-2 *:nth-2:grow">
      <div className="relative">
        <Input
          ref={inputRef}
          className="peer ps-9"
          value={searchValue}
          onChange={e => {
            const value = e.target.value;
            setSearchValue(value);

            // Apply the search to the tree's internal state as well
            const searchProps = tree.getSearchInputElementProps();
            if (searchProps.onChange) {
              searchProps.onChange(e);
            }

            if (value.length > 0) {
              // If input has at least one character, expand all items
              tree.expandAll();
            } else {
              // If input is cleared, reset to initial expanded state
              setState(prevState => ({
                ...prevState,
                expandedItems: initialExpandedItems,
              }));
              setFilteredItems([]);
            }
          }}
          // Prevent the internal search from being cleared on blur
          onBlur={e => {
            // Prevent default blur behavior
            e.preventDefault();

            // Re-apply the search to ensure it stays active
            if (searchValue && searchValue.length > 0) {
              const searchProps = tree.getSearchInputElementProps();
              if (searchProps.onChange) {
                const syntheticEvent = {
                  target: { value: searchValue },
                } as React.ChangeEvent<HTMLInputElement>;
                searchProps.onChange(syntheticEvent);
              }
            }
          }}
          // type="search"
          placeholder="Filter items..."
        />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
          <FilterIcon className="size-4" aria-hidden="true" />
        </div>
        {searchValue && (
          <button
            type="button"
            className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Clear search"
            onClick={handleClearSearch}
          >
            <CircleXIcon className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex h-full flex-col gap-2 *:first:grow">
        <Tree
          indent={indent}
          tree={tree}
          className="relative before:absolute before:inset-0 before:ms-4.5 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]"
        >
          {searchValue && filteredItems.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm">No items found for "{searchValue}"</p>
          ) : (
            tree.getItems().map(item => {
              const isVisible = shouldShowItem(item.getId());

              return (
                <div key={item.getId()} className="flex items-center gap-1.5 not-last:pb-0.5">
                  <Checkbox.Root
                    // disabled={!item.isFolder()}
                    checked={item.getCheckedState() === 'checked' ? true : false}
                    indeterminate
                    onCheckedChange={checked => {
                      const checkboxProps = item.getCheckboxProps();
                      checkboxProps.onChange?.({ target: { checked } });
                    }}
                  />
                  <TreeItem
                    item={item}
                    data-visible={isVisible || !searchValue}
                    className="flex-1 not-last:pb-0"
                  >
                    <TreeItemLabel className="before:bg-background relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10">
                      <span className="flex items-center gap-2">
                        {item.isFolder() &&
                          (item.isExpanded() ? (
                            <FolderOpenIcon className="text-muted-foreground pointer-events-none size-4" />
                          ) : (
                            <FolderIcon className="text-muted-foreground pointer-events-none size-4" />
                          ))}
                        {item.getItemName()}
                        {/* {item.isFolder() && ( */}
                        <span className="text-muted-foreground -ms-1">{`(${item?.getChildren().length})`}</span>
                        {/* )} */}
                      </span>
                    </TreeItemLabel>
                  </TreeItem>
                </div>
              );
            })
          )}
        </Tree>
      </div>
    </div>
  );
}
