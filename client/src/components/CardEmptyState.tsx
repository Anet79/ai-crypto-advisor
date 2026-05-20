type CardEmptyStateProps = {
  message: string;
};

export default function CardEmptyState({ message }: CardEmptyStateProps) {
  return (
    <p className="card-empty-state" role="status">
      {message}
    </p>
  );
}
