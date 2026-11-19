/// A Firestore document ID together with the model read from it.
///
/// The models do not contain their own ID (decisions/0006).
class Doc<T> {
  const Doc(this.id, this.data);

  final String id;
  final T data;
}
