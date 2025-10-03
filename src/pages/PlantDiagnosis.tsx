import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, ArrowLeft, Loader2 } from "lucide-react";
import plantDiagnosisIcon from "@/assets/plant-diagnosis-icon.png";

const PlantDiagnosis = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDiagnosis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      // Upload image to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("plant-images")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("plant-images")
        .getPublicUrl(fileName);

      // Call AI diagnosis function
      const { data, error } = await supabase.functions.invoke("diagnose-plant", {
        body: { imageUrl: publicUrl },
      });

      if (error) throw error;

      // Save diagnosis to database
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("plant_diagnoses").insert({
        user_id: user?.id,
        image_url: publicUrl,
        diagnosis: data.diagnosis,
        disease_detected: data.disease,
        confidence: data.confidence,
        recommendations: data.recommendations,
        status: "completed",
      });

      setDiagnosis(data);
      toast({
        title: "Analysis complete!",
        description: "Your plant has been diagnosed successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8 animate-harvest">
          <img src={plantDiagnosisIcon} alt="Plant Diagnosis" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Plant Diagnosis</h1>
          <p className="text-muted-foreground">
            Upload an image of your crop for AI-powered disease detection
          </p>
        </div>

        <Card className="animate-grow">
          <CardHeader>
            <CardTitle>Upload Plant Image</CardTitle>
            <CardDescription>
              Take a clear photo of the affected plant leaves or stems
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="w-12 h-12 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-muted-foreground">PNG, JPG up to 10MB</span>
              </label>
            </div>

            {previewUrl && (
              <div className="space-y-4 animate-harvest">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Plant"
                  )}
                </Button>
              </div>
            )}

            {diagnosis && (
              <Card className="bg-muted/50 animate-harvest">
                <CardHeader>
                  <CardTitle className="text-xl">Diagnosis Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Disease Detected:</h4>
                    <p className="text-muted-foreground">{diagnosis.disease || "No disease detected"}</p>
                  </div>
                  {diagnosis.confidence && (
                    <div>
                      <h4 className="font-semibold mb-1">Confidence:</h4>
                      <p className="text-muted-foreground">{diagnosis.confidence}%</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold mb-1">Diagnosis:</h4>
                    <p className="text-muted-foreground">{diagnosis.diagnosis}</p>
                  </div>
                  {diagnosis.recommendations && (
                    <div>
                      <h4 className="font-semibold mb-1">Recommendations:</h4>
                      <p className="text-muted-foreground">{diagnosis.recommendations}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PlantDiagnosis;
